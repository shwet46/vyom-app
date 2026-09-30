"""Unit tests for AI layer: Sarvam & Google clients, generation, repair, and deterministic mocks."""

from __future__ import annotations

import json

import pytest
from pydantic import BaseModel

from vyom.ai import (
    MockLLMClient,
    MockOCRClient,
    MockSTTClient,
    MockTranslateClient,
    MockTTSClient,
    get_llm_client,
    get_ocr_client,
    get_stt_client,
    get_translate_client,
    get_tts_client,
)
from vyom.ai.generation.fallback import FallbackTemplates
from vyom.ai.generation.prompts import (
    build_copilot_system_prompt,
    build_winback_prompt,
)
from vyom.ai.generation.repair import extract_json_block, parse_and_repair_json
from vyom.config import Settings


class SampleTargetSchema(BaseModel):
    name: str
    amount: int


@pytest.mark.asyncio
async def test_mock_llm_generation() -> None:
    """Verify mock LLM text and json generation."""
    llm = MockLLMClient()

    # Free text
    resp = await llm.generate([{"role": "user", "content": "Navratri ke liye kya stock karun?"}])
    assert "Navratri" in resp
    assert len(resp) > 20

    # JSON mode
    json_resp = await llm.generate(
        [{"role": "user", "content": "Generate a winback campaign"}],
        json_mode=True,
    )
    parsed = json.loads(json_resp)
    assert "headline" in parsed
    assert "discount_pct" in parsed


@pytest.mark.asyncio
async def test_mock_stt() -> None:
    """Verify mock STT transcription."""
    stt = MockSTTClient()
    transcript_hi = await stt.transcribe(b"dummy_audio_bytes", language_code="hi-IN")
    assert "Navratri" in transcript_hi or "stock" in transcript_hi

    transcript_mr = await stt.transcribe(b"dummy_audio_bytes", language_code="mr-IN")
    assert "साबुदाणा" in transcript_mr or "गणपती" in transcript_mr


@pytest.mark.asyncio
async def test_mock_tts() -> None:
    """Verify mock TTS produces playable WAV bytes."""
    tts = MockTTSClient()
    audio_bytes = await tts.synthesize("Namaste Sharma ji", target_language_code="hi-IN")
    assert len(audio_bytes) >= 44
    assert audio_bytes.startswith(b"RIFF")


@pytest.mark.asyncio
async def test_mock_ocr() -> None:
    """Verify mock handwritten khata ledger OCR extraction."""
    ocr = MockOCRClient()
    rows = await ocr.extract_khata_rows(b"fake_image_bytes")
    assert len(rows) >= 2
    assert "customer_name" in rows[0]
    assert "amount_paise" in rows[0]
    assert rows[0]["amount_paise"] > 0


@pytest.mark.asyncio
async def test_mock_translate() -> None:
    """Verify mock translation dictionary."""
    translator = MockTranslateClient()
    hi_text = await translator.translate("Namaste", target_language="hi-IN")
    assert hi_text == "नमस्ते"

    mr_text = await translator.translate("Namaste", target_language="mr-IN")
    assert mr_text == "नमस्कार"


def test_fallback_templates() -> None:
    """Verify cultural compliance of vetted fallback templates."""
    # Solemn winback should not have sale / loot
    solemn_copy = FallbackTemplates.winback("Sharma Kirana", "Ramesh", tone_profile="solemn")
    assert "dhamaka" not in solemn_copy["hinglish"].lower()
    assert "loot" not in solemn_copy["hinglish"].lower()
    assert "Shradh" in solemn_copy["hinglish"]

    # Udhaar reminders
    rem_gentle = FallbackTemplates.udhaar_reminder("Sunita", 450.0, tone="gentle")
    assert "विनम्र" in rem_gentle["hi"]
    assert "gentle" in rem_gentle["hinglish"]


def test_prompt_builders() -> None:
    """Verify prompt structure and system directives."""
    prompts = build_winback_prompt("Sharma Kirana", "Sunita", 14, ["Oil", "Atta"], tone_profile="solemn")
    assert len(prompts) == 2
    assert "Pitru Paksha" in prompts[1]["content"]

    copilot_sys = build_copilot_system_prompt("Sharma Kirana", "SHARMA01", "Pune", ["Navratri", "Diwali"])
    assert "SHARMA01" in copilot_sys
    assert "Pune" in copilot_sys


@pytest.mark.asyncio
async def test_json_repair_clean_and_fenced() -> None:
    """Verify markdown code fence stripping and JSON parsing."""
    fenced_text = "```json\n{\"name\": \"Ghee\", \"amount\": 450}\n```"
    cleaned = extract_json_block(fenced_text)
    assert cleaned == '{"name": "Ghee", "amount": 450}'

    res = await parse_and_repair_json(fenced_text, SampleTargetSchema)
    assert res is not None
    assert res.name == "Ghee"
    assert res.amount == 450


def test_ai_factories() -> None:
    """Verify AI factory switches to Mock in mock mode and handles configurations."""
    mock_settings = Settings(ai_mode="mock", sarvam_api_key="")
    llm = get_llm_client(mock_settings)
    assert isinstance(llm, MockLLMClient)

    stt = get_stt_client(mock_settings)
    assert isinstance(stt, MockSTTClient)

    tts = get_tts_client(mock_settings)
    assert isinstance(tts, MockTTSClient)

    ocr = get_ocr_client(mock_settings)
    assert isinstance(ocr, MockOCRClient)

    tr = get_translate_client(mock_settings)
    assert isinstance(tr, MockTranslateClient)
