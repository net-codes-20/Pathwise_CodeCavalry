"""
ai/client.py — AI / LLM Multi-Provider Orchestration Client

The single internal entry point the backend calls: ai_client.generate(...).
It picks a provider (Gemini primary, OpenRouter fallback, NVIDIA NIM second
fallback) based on what's configured/healthy, but callers never need to know
which provider actually served the request.

ALL API keys come from environment variables only (see ai/.env.example and
backend/.env.example). Never hardcode a key here, never send a key to the
frontend, never log a key.

Usage:
    from ai.client import ai_client
    text = ai_client.generate(system_prompt, user_prompt, json_mode=True)
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    # Loads the single root .env in local dev only (repo_root/.env, not a
    # per-folder one); in deployed envs (Render/Vercel) real env vars are
    # injected by the platform and this is a harmless no-op.
    from dotenv import load_dotenv

    _REPO_ROOT = Path(__file__).resolve().parents[1]
    load_dotenv(_REPO_ROOT / ".env")
except ImportError:
    pass


class AIProviderError(Exception):
    """Raised when a provider call fails after retries."""


@dataclass
class ProviderConfig:
    name: str
    api_key_env: str
    model_env: str
    default_model: str


# Order = fallback priority. Gemini first, OpenRouter second, NVIDIA NIM third.
_PROVIDERS = [
    ProviderConfig("gemini", "GEMINI_API_KEY", "GEMINI_MODEL", "gemini-2.0-flash"),
    ProviderConfig("openrouter", "OPENROUTER_API_KEY", "OPENROUTER_MODEL", "openrouter/auto"),
    ProviderConfig("nim", "NVIDIA_NIM_API_KEY", "NVIDIA_NIM_MODEL", "meta/llama-3.3-70b-instruct"),
]


class AIClient:
    """Provider-agnostic generation client. Prompts/schemas never change per-provider."""

    def __init__(self) -> None:
        self._active_provider: ProviderConfig | None = None

    def _configured_providers(self) -> list[ProviderConfig]:
        return [p for p in _PROVIDERS if os.environ.get(p.api_key_env)]

    def _call_gemini(self, system_prompt: str, user_prompt: str, json_mode: bool, cfg: ProviderConfig) -> str:
        import requests  # local import keeps this module importable without the dep at load time

        api_key = os.environ[cfg.api_key_env]
        model = os.environ.get(cfg.model_env, cfg.default_model)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        payload: dict[str, Any] = {
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {"temperature": 0.4},
        }
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        resp = requests.post(url, json=payload, timeout=12)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

    def _call_openrouter(self, system_prompt: str, user_prompt: str, json_mode: bool, cfg: ProviderConfig) -> str:
        import requests

        api_key = os.environ[cfg.api_key_env]
        model = os.environ.get(cfg.model_env, cfg.default_model)
        url = "https://openrouter.ai/api/v1/chat/completions"

        payload: dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.4,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        resp = requests.post(url, json=payload, headers=headers, timeout=12)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

    def _call_nim(self, system_prompt: str, user_prompt: str, json_mode: bool, cfg: ProviderConfig) -> str:
        import requests

        api_key = os.environ[cfg.api_key_env]
        model = os.environ.get(cfg.model_env, cfg.default_model)
        url = "https://integrate.api.nvidia.com/v1/chat/completions"

        payload: dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.4,
        }
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        resp = requests.post(url, json=payload, headers=headers, timeout=12)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

    _DISPATCH = {"gemini": "_call_gemini", "openrouter": "_call_openrouter", "nim": "_call_nim"}

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = True,
        retries: int = 1,
    ) -> str:
        """
        Call the first configured provider; fall through to the next on failure.
        Returns raw text (caller validates/parses JSON — see validate_json()).
        """
        providers = self._configured_providers()
        if not providers:
            raise AIProviderError(
                "No AI provider configured. Set GEMINI_API_KEY (or OPENROUTER_API_KEY / "
                "NVIDIA_NIM_API_KEY) in your .env file."
            )

        last_error: Exception | None = None
        for cfg in providers:
            call = getattr(self, self._DISPATCH[cfg.name])
            for attempt in range(retries + 1):
                try:
                    result = call(system_prompt, user_prompt, json_mode, cfg)
                    self._active_provider = cfg
                    return result
                except Exception as exc:  # noqa: BLE001 — deliberately broad, we fall back
                    last_error = exc
                    print(f"[AIClient] Provider {cfg.name} attempt {attempt+1} failed: {exc}. Trying next...")
                    continue
        raise AIProviderError(f"All configured AI providers failed. Last error: {last_error}")

    def generate_json(self, system_prompt: str, user_prompt: str, retries: int = 1) -> dict[str, Any]:
        """
        Convenience wrapper: generate() + parse + one retry on invalid JSON,
        per the spec's "validate before storing; retry once" guardrail.
        """
        raw = self.generate(system_prompt, user_prompt, json_mode=True, retries=retries)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            retry_prompt = (
                user_prompt
                + "\n\nYour previous response was not valid JSON. "
                + "Respond with ONLY a single valid JSON object, no markdown fences, no commentary."
            )
            raw_retry = self.generate(system_prompt, retry_prompt, json_mode=True, retries=0)
            return json.loads(raw_retry)  # let this raise if it still fails — caller shows error state


ai_client = AIClient()
