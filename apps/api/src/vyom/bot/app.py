"""Main Telegram bot application setup and router registration."""

from __future__ import annotations

import asyncio
from typing import Any

import structlog
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from vyom.bot.handlers.catalog import router as catalog_router
from vyom.bot.handlers.festival import router as festival_router
from vyom.bot.handlers.khata import router as khata_router
from vyom.bot.handlers.start import router as start_router
from vyom.bot.handlers.voice import router as voice_router
from vyom.config import Settings, get_settings
from vyom.db import close_mongo, init_mongo

logger = structlog.get_logger()


_bot: Bot | None = None
_dp: Dispatcher | None = None


def create_bot_and_dispatcher(settings: Settings | None = None) -> tuple[Bot, Dispatcher]:
    """Factory or singleton returning configured aiogram Bot and Dispatcher."""
    global _bot, _dp
    if _bot is None or _dp is None:
        cfg = settings or get_settings()
        token = cfg.telegram_bot_token.strip()
        if not token:
            raise ValueError("TELEGRAM_BOT_TOKEN must be configured")

        _bot = Bot(
            token=token,
            default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN),
        )

        _dp = Dispatcher()
        _dp.include_router(start_router)
        _dp.include_router(festival_router)
        _dp.include_router(khata_router)
        _dp.include_router(catalog_router)
        _dp.include_router(voice_router)

    return _bot, _dp


bot, dp = create_bot_and_dispatcher()


async def feed_telegram_update(update_dict: dict[str, Any]) -> None:
    """Feed incoming webhook update dictionary directly to the aiogram dispatcher."""
    from aiogram.types import Update

    telegram_update = Update.model_validate(update_dict, context={"bot": bot})
    await dp.feed_update(bot, telegram_update)


async def run_polling() -> None:
    """Run the Telegram bot as a standalone polling process."""
    settings = get_settings()
    await init_mongo(settings)
    try:
        await bot.delete_webhook(drop_pending_updates=False)
        logger.info("telegram_bot_polling_started", username=settings.bot_username or "configured")
        await dp.start_polling(bot)
    finally:
        await close_mongo()


if __name__ == "__main__":
    asyncio.run(run_polling())
