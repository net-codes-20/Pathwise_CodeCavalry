"""
backend/app/services/vark_service.py — VARK Assessment & Scoring Service

Calculates the official 20-question VARK learning style scores, compact raw string, and dominant style.
"""

from __future__ import annotations

from typing import Any

MODALITY_MAP = {
    "v": "visual",
    "a": "auditory",
    "r": "read_write",
    "k": "kinesthetic",
    "visual": "visual",
    "auditory": "auditory",
    "read_write": "read_write",
    "kinesthetic": "kinesthetic",
}

STYLE_LABELS = {
    "visual": "Visual",
    "auditory": "Aural (Auditory)",
    "read_write": "Read / Write",
    "kinesthetic": "Kinesthetic (Hands-on)",
    "multimodal": "Multimodal",
}


def calculate_vark(answers: list[dict[str, str]] | str) -> dict[str, Any]:
    """
    Calculate VARK scores from:
    1. A list of answers: [{"question_id": "q1", "selected_option": "visual" | "V"}]
    2. Or a 20-character raw string sequence: "VARKVARAKVVRKAVRAKVR"

    Returns:
    {
      "dominant_style": "Kinesthetic (Hands-on)" | "Visual" | "Aural (Auditory)" | "Read / Write" | "Multimodal",
      "scores": {"visual": 6, "auditory": 4, "read_write": 3, "kinesthetic": 7},
      "raw_string": "VARKVARAKVVRKAVRAKVR"
    }
    """
    scores = {"visual": 0, "auditory": 0, "read_write": 0, "kinesthetic": 0}
    raw_chars = []

    if isinstance(answers, str):
        # Parse compact raw sequence string
        for char in answers.upper():
            if char in ("V", "A", "R", "K"):
                key = {"V": "visual", "A": "auditory", "R": "read_write", "K": "kinesthetic"}[char]
                scores[key] += 1
                raw_chars.append(char)
    else:
        for answer in answers:
            opt = str(answer.get("selected_option") or "").lower().strip()
            # Check single char or full name
            char_tag = opt[0].upper() if opt else "V"
            if char_tag in ("V", "A", "R", "K"):
                raw_chars.append(char_tag)

            key = MODALITY_MAP.get(opt)
            if not key and char_tag in ("V", "A", "R", "K"):
                key = {"V": "visual", "A": "auditory", "R": "read_write", "K": "kinesthetic"}[char_tag]

            if key in scores:
                scores[key] += 1

    # Find highest and second highest
    sorted_scores = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    highest_style, highest_val = sorted_scores[0]
    _, second_highest_val = sorted_scores[1]

    # Multimodal threshold: difference between top two scores is <= 1 when total questions is 20
    if highest_val - second_highest_val <= 1 and highest_val > 0:
        dominant_style = "Multimodal"
    else:
        dominant_style = STYLE_LABELS.get(highest_style, highest_style.capitalize())

    raw_string = "".join(raw_chars) if raw_chars else "VARK"

    return {
        "dominant_style": dominant_style,
        "scores": scores,
        "raw_string": raw_string,
    }

