"""AI intelligence subsystem: Sarvam AI and Google clients, speech, OCR, and prompt generation."""

from __future__ import annotations

from vyom.ai.llm import (
    BaseLLMClient,
    GeminiLLMClient,
    MockLLMClient,
    SarvamLLMClient,
    get_llm_client,
)
from vyom.ai.ocr import BaseOCRClient, MockOCRClient, SarvamDocOCRClient, get_ocr_client
from vyom.ai.stt import BaseSTTClient, MockSTTClient, SarvamSTTClient, get_stt_client
from vyom.ai.translate import (
    BaseTranslateClient,
    MockTranslateClient,
    SarvamTranslateClient,
    get_translate_client,
)
from vyom.ai.tts import BaseTTSClient, MockTTSClient, SarvamTTSClient, get_tts_client

__all__ = [
    "BaseLLMClient",
    "BaseOCRClient",
    "BaseSTTClient",
    "BaseTTSClient",
    "BaseTranslateClient",
    "GeminiLLMClient",
    "MockLLMClient",
    "MockOCRClient",
    "MockSTTClient",
    "MockTTSClient",
    "MockTranslateClient",
    "SarvamDocOCRClient",
    "SarvamLLMClient",
    "SarvamSTTClient",
    "SarvamTTSClient",
    "SarvamTranslateClient",
    "get_llm_client",
    "get_ocr_client",
    "get_stt_client",
    "get_translate_client",
    "get_tts_client",
]
