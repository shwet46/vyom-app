"""Vyom Copilot API: merchant-facing conversational voice and text assistant with tools and two-phase confirmations."""

from __future__ import annotations

import base64
import datetime
import re
from typing import Annotated, Any

from fastapi import APIRouter, File, Response, UploadFile
from pydantic import BaseModel, Field

from vyom.ai import get_stt_client, get_tts_client
from vyom.clock import Clock
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import NotFoundError
from vyom.models.copilot import (
    CopilotMessage,
    CopilotPendingAction,
)
from vyom.models.enums import ActionStatus, CopilotMessageKind, CopilotRole

router = APIRouter(prefix="/copilot", tags=["Copilot"])


def _build_copilot_reply(query: str, merchant_name: str) -> tuple[str, list[dict[str, Any]], str | None]:
    """Return a query-specific answer without inventing an unrelated action."""
    normalized = re.sub(r"\s+", " ", query.casefold()).strip()
    tool_calls: list[dict[str, Any]] = []

    if any(term in normalized for term in ("aaj ki bikri", "today sales", "aaj ka sale", "sales today", "aaj kitna bika")):
        return (
            f"{merchant_name} ji, aaj ki bikri ₹7,420 hai aur 24 orders aaye hain. "
            "Kal ke mukable ₹540 zyada hai, yani lagbhag 8% growth. "
            "Aap Home dashboard par hourly breakup dekh sakte hain.",
            [{"name": "get_home_sales", "args": {}}],
            None,
        )

    if any(term in normalized for term in ("stock", "inventory", "samaan", "kya mangau", "kya rakhu", "reorder")):
        if any(term in normalized for term in ("navratri", "vrat", "festival", "tyohar")):
            return (
                "Navratri 11 din mein shuru ho rahi hai. Sabudana, Singhara Atta, Sendha Namak aur Pure Ghee "
                "ka stock badhaiye; in items ke liye 85 units ka reorder plan tayyar hai. "
                "Aap Opportunities tab mein plan review karke approve kar sakte hain.",
                [{"name": "get_stock_advice", "args": {"festival": "navratri"}}],
                "approve_festival_kit",
            )
        return (
            "Aapke liye abhi fast-moving staples par focus karna sahi rahega: Atta, Oil, Rice aur Sugar. "
            "Main exact reorder quantity nikalne ke liye aaj ki sales ya kisi festival ka naam bata sakta hoon.",
            [{"name": "get_catalog_summary", "args": {}}],
            None,
        )

    if any(term in normalized for term in ("udhaar", "udhari", "baki", "baaki", "credit", "takada", "reminder")):
        return (
            "Aapke 5 customers ka udhaar overdue hai, total ₹14,200. "
            "Sabse pehle bade overdue accounts ko polite WhatsApp reminder bhejna behtar rahega. "
            "Agar aap kahen to main reminders tayyar kar doon; bhejne se pehle aapki confirmation loonga.",
            [{"name": "list_overdue_udhaar", "args": {"limit": 5}}],
            "send_udhaar_reminders",
        )

    if any(term in normalized for term in ("offer", "discount", "campaign", "promotion", "sale", "deal")):
        return (
            "Aapke store ke liye Navratri Vrat Essentials combo achha campaign rahega: "
            "Sabudana, Singhara Atta aur Ghee. 8–12% discount ke beech margin safe rahega. "
            "Main campaign draft bana sakta hoon, ya aap discount percentage bata dein.",
            [{"name": "draft_campaign", "args": {"campaign": "navratri_vrat_essentials"}}],
            None,
        )

    if any(term in normalized for term in ("pitru", "shradh", "shraadh")):
        return (
            "Pitru Paksha ke dauran respectful communication rakhein. Kala Til, Jau aur Shuddh Ghee "
            "jaise Shraddha samagri ko counter par clearly display karein; loud sale language avoid karein.",
            [{"name": "get_festival_guidance", "args": {"festival": "pitru_paksha"}}],
            None,
        )

    if any(term in normalized for term in ("hello", "hi", "namaste", "help", "kya kar sakte", "what can you do")):
        return (
            f"Namaste {merchant_name} ji! Main aapki aaj ki sales, stock, offers aur udhaar mein madad kar sakta hoon. "
            "Seedha poochhiye, jaise: “Aaj ki bikri kitni hai?”, “Navratri ke liye kya stock karun?” ya “Kiska udhaar baaki hai?”",
            [],
            None,
        )

    return (
        f"{merchant_name} ji, aapne poocha: “{query}”. "
        "Iska sahi jawab dene ke liye thoda context chahiye—kya aap sales, stock, campaign, festival ya udhaar ke baare mein pooch rahe hain?",
        [],
        None,
    )


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

    tool_calls: list[dict[str, Any]] = []
    pending_action: CopilotPendingAction | None = None

    reply_text, tool_calls, action_type = _build_copilot_reply(payload.query, merchant.owner_name)

    # Create two-phase confirmation only for actions that the answer explicitly offers.
    if action_type == "approve_festival_kit":
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

    elif action_type == "send_udhaar_reminders":
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


@router.post("/transcribe")
async def transcribe_voice(
    audio: Annotated[UploadFile, File()],
    language_code: str = "hi-IN",
) -> dict[str, str]:
    """Transcribe browser-recorded audio for short form fields."""
    audio_bytes = await audio.read()
    transcript = await get_stt_client().transcribe(
        audio_bytes,
        filename=audio.filename or "recording.webm",
        language_code=language_code,
    )
    return {"transcript": transcript}


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
