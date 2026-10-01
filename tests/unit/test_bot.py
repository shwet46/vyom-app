"""Unit tests for Telegram Shop Bot handlers, keyboards, and dispatching."""

from __future__ import annotations

import datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from aiogram import Bot, Dispatcher
from aiogram.types import CallbackQuery, Chat, Message, User

from vyom.bot import create_bot_and_dispatcher
from vyom.bot.handlers.catalog import handle_store_info
from vyom.bot.handlers.festival import handle_kit_preorder
from vyom.bot.handlers.khata import handle_my_khata
from vyom.bot.handlers.start import handle_start
from vyom.bot.handlers.voice import handle_voice_message
from vyom.bot.keyboards import (
    get_festival_kit_keyboard,
    get_khata_payment_keyboard,
    get_language_keyboard,
    get_main_menu_keyboard,
)
from vyom.config import Settings


def test_bot_keyboards() -> None:
    """Verify markup and callback data for all bot keyboards."""
    # Main menu
    menu = get_main_menu_keyboard()
    button_texts = [btn.text for row in menu.keyboard for btn in row]
    assert "🛍️ Store & Specials" in button_texts
    assert "📦 Festival Kits" in button_texts
    assert "📒 Mera Khata (Udhaar)" in button_texts
    assert "🗣️ Voice Order" in button_texts

    # Language keyboard
    lang_kb = get_language_keyboard()
    callbacks = [btn.callback_data for row in lang_kb.inline_keyboard for btn in row]
    assert "lang:hinglish" in callbacks
    assert "lang:mr" in callbacks
    assert "lang:hi" in callbacks

    # Kit keyboard
    kit_kb = get_festival_kit_keyboard("navratri_kit", 450.0)
    assert any("kit_order:navratri_kit" in btn.callback_data for row in kit_kb.inline_keyboard for btn in row if btn.callback_data)

    # Khata keyboard
    khata_kb = get_khata_payment_keyboard("token123", 450.0)
    assert any("token123" in (btn.url or "") for row in khata_kb.inline_keyboard for btn in row)


def test_create_bot_and_dispatcher() -> None:
    """Verify bot and dispatcher instantiation with an explicit test token."""
    bot, dp = create_bot_and_dispatcher(Settings(telegram_bot_token="1234567890:AATestTelegramTokenForUnitTests"))
    assert isinstance(bot, Bot)
    assert isinstance(dp, Dispatcher)


@pytest.mark.asyncio
async def test_start_handler(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify /start onboarding creates or finds customer and responds with welcome menu."""
    mock_db = MagicMock()
    mock_merchants = MagicMock()
    mock_customers = MagicMock()

    mock_merchants.find_one = AsyncMock(return_value={"_id": "merchant_sharma_01", "name": "Sharma Kirana Store"})
    mock_customers.find_one = AsyncMock(return_value=None)
    mock_customers.insert_one = AsyncMock(return_value=None)

    mock_db.merchants = mock_merchants
    mock_db.customers = mock_customers
    monkeypatch.setattr("vyom.bot.handlers.start.get_db", lambda: mock_db)

    mock_answer = AsyncMock()
    monkeypatch.setattr(Message, "answer", mock_answer)

    user = User(id=987654321, is_bot=False, first_name="Ramesh", username="ramesh_customer")
    chat = Chat(id=987654321, type="private")
    message = Message(
        message_id=1,
        date=datetime.datetime.now(),
        chat=chat,
        from_user=user,
        text="/start SHARMA01",
    )

    await handle_start(message)
    mock_answer.assert_called_once()
    args, kwargs = mock_answer.call_args
    assert "Sharma Kirana Store" in args[0]
    assert kwargs.get("reply_markup") is not None


@pytest.mark.asyncio
async def test_store_info_handler(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify store and specials information response."""
    mock_db = MagicMock()
    mock_merchants = MagicMock()
    mock_merchants.find_one = AsyncMock(return_value={
        "_id": "merchant_sharma_01",
        "name": "Sharma Kirana Store",
        "address": "Somwar Peth, Pune",
        "todays_special": "Vrat Sabudana in stock",
    })
    mock_db.merchants = mock_merchants
    monkeypatch.setattr("vyom.bot.handlers.catalog.get_db", lambda: mock_db)

    mock_answer = AsyncMock()
    monkeypatch.setattr(Message, "answer", mock_answer)

    message = Message(
        message_id=2,
        date=datetime.datetime.now(),
        chat=Chat(id=123, type="private"),
        text="🛍️ Store & Specials",
    )

    await handle_store_info(message)
    mock_answer.assert_called_once()
    args, _ = mock_answer.call_args
    assert "Sharma Kirana Store" in args[0]
    assert "Vrat Sabudana" in args[0]


@pytest.mark.asyncio
async def test_festival_kit_preorder(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify festival kit pre-order registers request and broadcasts SSE event."""
    mock_db = MagicMock()
    mock_customers = MagicMock()
    mock_customers.find_one = AsyncMock(return_value={"_id": "cust_001"})
    mock_kit_requests = MagicMock()
    mock_kit_requests.insert_one = AsyncMock()

    mock_db.customers = mock_customers
    mock_db.kit_requests = mock_kit_requests
    monkeypatch.setattr("vyom.bot.handlers.festival.get_db", lambda: mock_db)

    mock_cb_answer = AsyncMock()
    monkeypatch.setattr(CallbackQuery, "answer", mock_cb_answer)
    mock_msg_answer = AsyncMock()
    monkeypatch.setattr(Message, "answer", mock_msg_answer)

    user = User(id=987654321, is_bot=False, first_name="Sunita Patil")
    chat = Chat(id=987654321, type="private")
    dummy_msg = Message(
        message_id=99,
        date=datetime.datetime.now(),
        chat=chat,
        text="Preorder kit",
    )
    query = CallbackQuery(
        id="cb_1",
        from_user=user,
        chat_instance="inst_1",
        data="kit_order:navratri_vrat_kit",
        message=dummy_msg,
    )

    await handle_kit_preorder(query)
    mock_kit_requests.insert_one.assert_called_once()
    mock_cb_answer.assert_called_once()


@pytest.mark.asyncio
async def test_khata_handler(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify khata outstanding balance query."""
    mock_db = MagicMock()
    mock_customers = MagicMock()
    mock_customers.find_one = AsyncMock(return_value={"_id": "cust_sharma_001", "name": "Sunita Patil"})

    class AsyncEntryCursor:
        def __init__(self) -> None:
            self.docs = [{
                "amount_total_paise": 45000,
                "amount_paid_paise": 0,
                "due_date": datetime.date(2026, 10, 5),
            }]
            self.idx = 0

        def __aiter__(self) -> AsyncEntryCursor:
            return self

        async def __anext__(self) -> dict[str, Any]:
            if self.idx < len(self.docs):
                item = self.docs[self.idx]
                self.idx += 1
                return item
            raise StopAsyncIteration

    mock_khata = MagicMock()
    mock_khata.find = MagicMock(return_value=AsyncEntryCursor())
    mock_payments = MagicMock()
    mock_payments.update_one = AsyncMock()

    mock_db.customers = mock_customers
    mock_db.khata_entries = mock_khata
    mock_db.payments = mock_payments
    monkeypatch.setattr("vyom.bot.handlers.khata.get_db", lambda: mock_db)

    mock_answer = AsyncMock()
    monkeypatch.setattr(Message, "answer", mock_answer)

    message = Message(
        message_id=3,
        date=datetime.datetime.now(),
        chat=Chat(id=987654321, type="private"),
        from_user=User(id=987654321, is_bot=False, first_name="Sunita"),
        text="📒 Mera Khata (Udhaar)",
    )

    await handle_my_khata(message)
    mock_answer.assert_called_once()
    args, kwargs = mock_answer.call_args
    assert "₹450" in args[0]
    assert kwargs.get("reply_markup") is not None


@pytest.mark.asyncio
async def test_voice_order_handler(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify voice message handling and order confirmation."""
    mock_db = MagicMock()
    mock_voice_orders = MagicMock()
    mock_voice_orders.insert_one = AsyncMock()
    mock_db.voice_orders = mock_voice_orders
    monkeypatch.setattr("vyom.bot.handlers.voice.get_db", lambda: mock_db)

    mock_answer = AsyncMock()
    monkeypatch.setattr(Message, "answer", mock_answer)

    message = Message(
        message_id=4,
        date=datetime.datetime.now(),
        chat=Chat(id=12345, type="private"),
        from_user=User(id=12345, is_bot=False, first_name="Aarav"),
        text=None,
    )

    await handle_voice_message(message)
    mock_voice_orders.insert_one.assert_called_once()
    mock_answer.assert_called_once()
    args, _ = mock_answer.call_args
    assert "Voice Order" in args[0]
