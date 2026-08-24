/**
 * frontend/src/api/client.js — API Client & Fetch Wrapper
 *
 * Thin fetch wrapper. No business logic lives here — just request/response
 * plumbing and error normalization so pages can `await` and branch on
 * `.ok` / `.data` / `.error`.
 */

let rawBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").trim().replace(/\/+$/, "");
if (!rawBase.endsWith("/api")) {
  rawBase = `${rawBase}/api`;
}
const BASE_URL = rawBase;

async function request(path, { method = "GET", body, params } = {}) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : null;

    if (!res.ok) {
      return { ok: false, status: res.status, error: data?.detail || data?.error || "request_failed", data };
    }
    return { ok: true, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, error: "network_error", detail: err.message };
  }
}

export const apiGet = (path, params) => request(path, { method: "GET", params });
export const apiPost = (path, body) => request(path, { method: "POST", body });
export const apiPut = (path, body) => request(path, { method: "PUT", body });
export const apiPatch = (path, body) => request(path, { method: "PATCH", body });
