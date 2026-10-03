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
        _dp.include_router(khata_router)
        _dp.include_router(festival_router)
        _dp.include_router(voice_router)
        _dp.include_router(catalog_router)

    return _bot, _dp


try:
    bot, dp = create_bot_and_dispatcher()
except ValueError:
    # Token not yet configured — bot will be created lazily when first needed
    bot = None  # type: ignore[assignment]
    dp = None   # type: ignore[assignment]
    logger.warning("telegram_bot_token_not_configured_at_import")


async def feed_telegram_update(update_dict: dict[str, Any]) -> None:
    """Feed incoming webhook update dictionary directly to the aiogram dispatcher."""
    from aiogram.types import Update

    telegram_update = Update.model_validate(update_dict, context={"bot": bot})
    await dp.feed_update(bot, telegram_update)


async def run_polling() -> None:
    """Run the Telegram bot as a standalone polling process.

    Designed for use in a dedicated Docker container or Render Background Worker.
    Automatically retries on transient Telegram API errors.
    """
    global _bot, _dp
    settings = get_settings()
    await init_mongo(settings)
    _backoff = 2.0
    _max_backoff = 60.0
    try:
        while True:
            try:
                # Re-create bot/dispatcher on each reconnect attempt to
                # ensure a clean connection session
                _bot = None
                _dp = None
                local_bot, local_dp = create_bot_and_dispatcher(settings)
                await local_bot.delete_webhook(drop_pending_updates=False)
                logger.info(
                    "telegram_bot_polling_started",
                    username=settings.bot_username or "configured",
                )
                # handle_signals=False: caller owns SIGINT/SIGTERM
                await local_dp.start_polling(local_bot, handle_signals=False)
                # Clean exit
                break
            except asyncio.CancelledError:
                raise
            except Exception as err:
                logger.warning(
                    "telegram_bot_polling_error",
                    error=str(err),
                    retry_in=_backoff,
                )
                await asyncio.sleep(_backoff)
                _backoff = min(_backoff * 2, _max_backoff)
    finally:
        await close_mongo()


if __name__ == "__main__":
    asyncio.run(run_polling())
