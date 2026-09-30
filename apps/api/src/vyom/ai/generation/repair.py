"""JSON schema validation and self-repair loop for LLM outputs."""

from __future__ import annotations

import json
import re

import structlog
from pydantic import BaseModel, ValidationError

from vyom.ai.llm import BaseLLMClient

logger = structlog.get_logger()


def extract_json_block(text: str) -> str:
    """Extract raw JSON text from markdown code blocks or surrounding text."""
    trimmed = text.strip()
    # Match ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", trimmed, re.DOTALL)
    if match:
        return match.group(1).strip()

    # Find first { and last }
    first_brace = trimmed.find("{")
    last_brace = trimmed.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return trimmed[first_brace : last_brace + 1].strip()

    first_bracket = trimmed.find("[")
    last_bracket = trimmed.rfind("]")
    if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
        return trimmed[first_bracket : last_bracket + 1].strip()

    return trimmed


async def parse_and_repair_json[T: BaseModel](
    raw_text: str,
    target_schema: type[T],
    llm_client: BaseLLMClient | None = None,
    max_retries: int = 1,
) -> T | None:
    """Parse JSON text into target Pydantic model with single-shot auto-repair if malformed."""
    cleaned = extract_json_block(raw_text)

    try:
        data = json.loads(cleaned)
        return target_schema.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.warning("json_validation_failed_attempting_repair", error=str(exc))

        if llm_client and max_retries > 0:
            repair_prompt = [
                {
                    "role": "system",
                    "content": "You are a JSON repair tool. You take invalid or malformed JSON and fix it to strictly match the requested JSON schema. Output ONLY the raw JSON, no markdown, no explanation.",
                },
                {
                    "role": "user",
                    "content": f"Schema: {target_schema.model_json_schema()}\n\nMalformed text:\n{raw_text}\n\nError: {exc}\n\nFixed JSON:",
                },
            ]
            try:
                repaired_text = await llm_client.generate(repair_prompt, temperature=0.1, json_mode=True)
                repaired_cleaned = extract_json_block(repaired_text)
                repaired_data = json.loads(repaired_cleaned)
                return target_schema.model_validate(repaired_data)
            except Exception as repair_exc:
                logger.error("json_repair_attempt_failed", error=str(repair_exc))

    return None
