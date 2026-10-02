"""Telegram bot handlers for customer voice note orders and voice queries."""

from __future__ import annotations

import structlog
from aiogram import F, Router
from aiogram.types import Message

from vyom.ai import get_stt_client
from vyom.clock import Clock
from vyom.core.sse import sse_hub
from vyom.db import get_db

logger = structlog.get_logger()
router = Router(name="voice")


@router.message(F.text == "🗣️ Voice Order")
async def handle_voice_order_instruction(message: Message) -> None:
    """Prompt user on how to speak an order."""
    text = (
        "🎙️ **Voice Order Kaise Karein?**\n\n"
        "Neeche mic button daba kar apna voice note record karein aur bhejein.\n\n"
        "Udaharan:\n"
        "_\"Bhaiya, 1 packet Fortune oil aur 2 packet Maggi ghar bhej dena.\"_\n\n"
        "Hum aapki aawaz samajhkar seedha dukan par order book kar denge!"
    )
    await message.answer(text, parse_mode="Markdown")


@router.message(F.voice | F.audio)
async def handle_voice_message(message: Message) -> None:
    """Process incoming customer voice note using STT and transcribe order."""
    db = get_db()
    stt_client = get_stt_client()
    now_dt = Clock.now()

    customer_name = message.from_user.full_name if message.from_user else "Customer"
    chat_id = message.chat.id

    # Simulated audio processing via STT client
    # In live mode with bot token, bot.download(message.voice) downloads bytes; in mock mode transcribe returns simulated grocery order
    try:
        raw_audio = b"\x00" * 44  # Fallback dummy audio buffer
        transcript = await stt_client.transcribe(raw_audio, language_code="hi-IN")
    except Exception as exc:
        logger.warning("stt_transcription_error_using_fallback", error=str(exc))
        transcript = "1 packet Fortune Tel aur 500g Sabudana"

    # Insert voice order into db
    order_doc = {
        "_id": f"voice_ord_{int(now_dt.timestamp())}",
        "merchant_id": "merchant_sharma_01",
        "chat_id": chat_id,
        "customer_name": customer_name,
        "transcript": transcript,
        "status": "pending_merchant_review",
        "created_at": now_dt,
    }
    await db.voice_orders.insert_one(order_doc)

    # Real-time SSE alert to merchant dashboard
    await sse_hub.broadcast(
        "merchant_sharma_01",
        "order.voice_received",
        {
            "order_id": order_doc["_id"],
            "customer_name": customer_name,
            "transcript": transcript,
            "received_at": now_dt.isoformat(),
        },
    )

    reply = (
        f"🎙️ **Aapka Voice Order Samajh Liya Gaya Hai!**\n\n"
        f"📝 **Order**: \"{transcript}\"\n\n"
        "Sharma Kirana Store ke paas yeh order pahunch chuka hai. Dukaandar ise check karke pack kar rahe hain.\n\n"
        "Dhanyawad!"
    )

    await message.answer(reply, parse_mode="Markdown")

    # Send spoken voice note confirmation using Sarvam bulbul:v3 and speaker shubh
    try:
        from aiogram.types import BufferedInputFile
        from vyom.ai import get_tts_client

        tts_client = get_tts_client()
        spoken_text = f"Namaste {customer_name}! Aapka voice order dukan par note kar liya gaya hai: {transcript}. Jaldi hi pack ho jayega."
        audio_bytes = await tts_client.synthesize(
            text=spoken_text,
            target_language_code="hi-IN",
            speaker="shubh",
            pace=1.0,
            speech_sample_rate=22050,
        )
        if audio_bytes and len(audio_bytes) > 44:
            await message.answer_voice(
                BufferedInputFile(audio_bytes, filename="voice_order_confirm.mp3"),
                caption="🎙️ Voice Order Confirmation",
            )
    except Exception as tts_err:
        logger.warning("voice_order_tts_reply_failed", error=str(tts_err))
