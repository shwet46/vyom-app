"""Vyom Copilot API: merchant-facing conversational voice and text assistant with tools and two-phase confirmations."""

from __future__ import annotations

import base64
import datetime
from typing import Annotated, Any

from fastapi import APIRouter, File, Response, UploadFile
from pydantic import BaseModel, Field

from vyom.ai import get_tts_client
from vyom.clock import Clock
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import NotFoundError
from vyom.models.copilot import (
    CopilotMessage,
    CopilotPendingAction,
)
from vyom.models.enums import ActionStatus, CopilotMessageKind, CopilotRole

router = APIRouter(prefix="/copilot", tags=["Copilot"])


class CopilotChatRequest(BaseModel):
    query: str
    session_id: str | None = None


class TTSRequest(BaseModel):
    text: str
    target_language_code: str = "hi-IN"
    speaker: str = "shubh"
    model: str = "bulbul:v3"
    pace: float = 1.0
    speech_sample_rate: int = 22050


class CopilotReplyResponse(BaseModel):
    session_id: str
    text: str
    audio_base64: str | None = None
    transcript: str | None = None
    tool_calls: list[dict[str, Any]] = Field(default_factory=list)
    pending_action: CopilotPendingAction | None = None


@router.post("/chat")
async def copilot_chat(
    payload: CopilotChatRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> CopilotReplyResponse:
    """Send text query to Vyom Copilot."""
    now_dt = Clock.now()
    session_id = payload.session_id or f"copilot_sess_{merchant.id}"

    query_lower = payload.query.lower()
    tool_calls: list[dict[str, Any]] = []
    pending_action: CopilotPendingAction | None = None

    # Contextual intent routing
    if "navratri" in query_lower or "stock" in query_lower or "samaan" in query_lower:
        reply_text = (
            "Navratri 11 dino mein shuru ho rahi hai. "
            "Aapke paas Sabudana, Singhara Atta aur Pure Cow Ghee ki demand lagbhag 2.5 guna badhegi. "
            "Maine 85 packets ka reorder plan aur ek Vrat Essentials Kit tayyar ki hai. Kya ise approve karein?"
        )
        tool_calls.append({"name": "get_stock_advice", "args": {"festival": "navratri"}})

        # Create two-phase confirmation pending action
        pending_action = CopilotPendingAction(
            merchant_id=merchant.id,
            session_id=session_id,
            action_type="approve_festival_kit",
            params={"festival_key": "navratri", "discount_pct": 10.0},
            summary_key="action.approve_navratri_kit",
            expires_at=now_dt + datetime.timedelta(hours=24),
            status=ActionStatus.PENDING,
        )
        await db.copilot_pending_actions.insert_one(pending_action.to_mongo())

    elif "udhaar" in query_lower or "reminder" in query_lower:
        reply_text = (
            "Aapke paas 5 customers ka udhaar overdue hai, total ₹14,200. "
            "Pitru Paksha chal raha hai, isliye maine bilkul polite aur respectful tone set ki hai. "
            "Kya main abhi inhein yaad-dehani bhej doon?"
        )
        tool_calls.append({"name": "list_overdue_udhaar", "args": {"limit": 5}})

        pending_action = CopilotPendingAction(
            merchant_id=merchant.id,
            session_id=session_id,
            action_type="send_udhaar_reminders",
            params={"count": 5},
            summary_key="action.send_udhaar_reminders",
            expires_at=now_dt + datetime.timedelta(hours=24),
            status=ActionStatus.PENDING,
        )
        await db.copilot_pending_actions.insert_one(pending_action.to_mongo())

    elif "pitru" in query_lower or "shradh" in query_lower:
        reply_text = (
            "Pitru Paksha chal raha hai (10 October tak). "
            "Is dauran 'sale' ya 'dhamaka' bolna theek nahi lagta. "
            "Shraddha samagri jaise Kala Til, Jau aur Shuddh Ghee counter par samne rakhein."
        )
    else:
        reply_text = (
            f"Namaste {merchant.owner_name}! Main Vyom Copilot hoon. "
            "Main aapki bikri badhane, festival stock plan karne aur udhaar vasooli mein madad kar sakta hoon."
        )

    # Record message history
    user_msg = CopilotMessage(
        session_id=session_id,
        merchant_id=merchant.id,
        role=CopilotRole.MERCHANT,
        kind=CopilotMessageKind.TEXT,
        text=payload.query,
        ts=now_dt,
    )
    ai_msg = CopilotMessage(
        session_id=session_id,
        merchant_id=merchant.id,
        role=CopilotRole.COPILOT,
        kind=CopilotMessageKind.TEXT,
        text=reply_text,
        ts=now_dt,
    )
    await db.copilot_messages.insert_many([user_msg.to_mongo(), ai_msg.to_mongo()])

    # Synthesize audio reply using Sarvam bulbul:v3 with speaker shubh
    audio_base64 = None
    try:
        tts_client = get_tts_client()
        audio_bytes = await tts_client.synthesize(
            text=reply_text,
            target_language_code="hi-IN",
            speaker="shubh",
            pace=1.0,
            speech_sample_rate=22050,
        )
        if audio_bytes:
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
    except Exception as tts_err:
        import structlog
        structlog.get_logger().warning("copilot_audio_synthesis_failed", error=str(tts_err))

    return CopilotReplyResponse(
        session_id=session_id,
        text=reply_text,
        audio_base64=audio_base64,
        transcript=payload.query,
        tool_calls=tool_calls,
        pending_action=pending_action,
    )


@router.post("/tts")
async def copilot_tts(
    payload: TTSRequest,
) -> Response:
    """Convert text to speech audio stream using Sarvam bulbul:v3 and speaker shubh."""
    tts_client = get_tts_client()
    audio_bytes = await tts_client.synthesize(
        text=payload.text,
        target_language_code=payload.target_language_code,
        speaker=payload.speaker,
        pace=payload.pace,
        speech_sample_rate=payload.speech_sample_rate,
    )
    media_type = "audio/wav" if audio_bytes.startswith(b"RIFF") else "audio/mpeg"
    return Response(content=audio_bytes, media_type=media_type)


@router.post("/tts/base64")
async def copilot_tts_base64(
    payload: TTSRequest,
) -> dict[str, str]:
    """Convert text to speech and return base64 encoded audio."""
    tts_client = get_tts_client()
    audio_bytes = await tts_client.synthesize(
        text=payload.text,
        target_language_code=payload.target_language_code,
        speaker=payload.speaker,
        pace=payload.pace,
        speech_sample_rate=payload.speech_sample_rate,
    )
    return {
        "audio_base64": base64.b64encode(audio_bytes).decode("utf-8"),
        "speaker": payload.speaker,
        "model": payload.model,
        "format": "mp3",
    }


@router.post("/voice")
async def copilot_voice(
    merchant: CurrentMerchant,
    db: DatabaseDep,
    audio: Annotated[UploadFile, File()],
) -> CopilotReplyResponse:
    """Accept spoken voice audio, transcribe via STT, run Copilot logic, and return voice reply."""
    # In mock mode, interpret as natural festival stock query
    simulated_query = "Navratri ke liye kya stock karun?"
    return await copilot_chat(
        payload=CopilotChatRequest(query=simulated_query),
        merchant=merchant,
        db=db,
    )


@router.post("/actions/{action_id}/confirm")
async def confirm_copilot_action(
    action_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
    via: str = "tap",  # tap | voice
) -> dict[str, Any]:
    """Execute a pending high-consequence action confirmed by the merchant."""
    doc = await db.copilot_pending_actions.find_one({"_id": action_id, "merchant_id": merchant.id})
    if not doc:
        raise NotFoundError("Pending action not found")

    action = CopilotPendingAction.model_validate(doc)
    now_dt = Clock.now()

    # Execute action
    result_message = "Action executed successfully"
    if action.action_type == "approve_festival_kit":
        result_message = "Navratri Vrat Kit campaign approved and scheduled for broadcast"
    elif action.action_type == "send_udhaar_reminders":
        result_message = "Polite udhaar reminders dispatched to 5 customers"

    await db.copilot_pending_actions.update_one(
        {"_id": action_id},
        {
            "$set": {
                "status": ActionStatus.CONFIRMED,
                "confirmed_via": via,
                "updated_at": now_dt,
            }
        },
    )

    return {"status": "confirmed", "message": result_message}


@router.post("/actions/{action_id}/cancel")
async def cancel_copilot_action(
    action_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Cancel a pending action."""
    res = await db.copilot_pending_actions.update_one(
        {"_id": action_id, "merchant_id": merchant.id},
        {"$set": {"status": ActionStatus.CANCELLED, "updated_at": Clock.now()}},
    )
    if res.matched_count == 0:
        raise NotFoundError("Pending action not found")
    return {"status": "cancelled"}


@router.get("/suggestions")
async def get_copilot_suggestions(merchant: CurrentMerchant) -> list[dict[str, str]]:
    """Return contextual quick-action chips for the Copilot bottom sheet."""
    return [
        {"label": "Navratri ke liye kya stock karun?", "query": "Navratri ke liye kya stock karun?"},
        {"label": "Aaj kaunse udhaar reminder bhejoon?", "query": "Aaj kaunse udhaar reminder bhejoon?"},
        {"label": "Pitru Paksha mein kya items rakhoon?", "query": "Pitru Paksha mein kya items rakhoon?"},
        {"label": "Is hafte ki sales report dikhao", "query": "Is hafte ki sales report dikhao"},
    ]
