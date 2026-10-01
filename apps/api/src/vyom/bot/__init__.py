"""Customer-facing Telegram Shop Bot (aiogram v3)."""

from typing import Any

__all__ = ["bot", "create_bot_and_dispatcher", "dp", "feed_telegram_update"]


def __getattr__(name: str) -> Any:
    """Load bot objects lazily to support running ``vyom.bot.app`` as a module."""
    if name in __all__:
        from vyom.bot import app

        return getattr(app, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
