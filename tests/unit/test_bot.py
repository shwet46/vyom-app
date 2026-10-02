"""Unit tests for Telegram Shop Bot handlers, keyboards, and dispatching."""

from __future__ import annotations

import datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from aiogram import Bot, Dispatcher
from aiogram.types import CallbackQuery, Chat, Document, Message, PhotoSize, User
from aiogram.types import File as TgFile

from vyom.bot import create_bot_and_dispatcher
from vyom.bot.handlers.catalog import (
    handle_contact_store,
    handle_unrecognized_query_escalation,
)
from vyom.bot.handlers.festival import (
    handle_kit_preorder,
    handle_store_sales_and_discounts,
)
from vyom.bot.handlers.khata import (
    handle_deadline_selection,
    handle_khata_document_upload,
    handle_khata_photo_upload,
    handle_my_khata,
    handle_pay_now_direct,
)
from vyom.bot.handlers.start import handle_start
from vyom.bot.handlers.voice import handle_voice_message
from vyom.bot.keyboards import (
    get_deadline_selection_keyboard,
    get_escalation_keyboard,
    get_festival_kit_keyboard,
    get_khata_action_keyboard,
    get_language_keyboard,
    get_main_menu_keyboard,
    get_offers_keyboard,
)
from vyom.config import Settings


def test_bot_keyboards() -> None:
    """Verify markup and callback data for all bot keyboards."""
    # Main menu focused on khata bill, payment/QR, deadline, sales/discounts, and contact
    menu = get_main_menu_keyboard()
    button_texts = [btn.text for row in menu.keyboard for btn in row]
    assert "🧾 Mera Khata & Bill (Udhaar)" in button_texts
    assert "💳 Abhi Pay Karein (Pay Now / QR)" in button_texts
    assert "📅 Payment Deadline Set Karein" in button_texts
    assert "🏷️ Dukaan Ke Offers & Sales" in button_texts
    assert "📞 Dukaan Se Baat Karein (Support)" in button_texts

    # Language keyboard
    lang_kb = get_language_keyboard()
    callbacks = [btn.callback_data for row in lang_kb.inline_keyboard for btn in row]
    assert "lang:hinglish" in callbacks
    assert "lang:mr" in callbacks
    assert "lang:hi" in callbacks

    # Kit keyboard
    kit_kb = get_festival_kit_keyboard("navratri_kit", 450.0)
    assert any("kit_order:navratri_kit" in btn.callback_data for row in kit_kb.inline_keyboard for btn in row if btn.callback_data)

    # Khata action keyboard with public URL
    khata_kb = get_khata_action_keyboard("token123", 1350.0, "https://paytm.me/pay?token=token123")
    assert any("token123" in (btn.url or "") for row in khata_kb.inline_keyboard for btn in row)
    # Khata action keyboard with localhost (dev mode fallback to callback)
    khata_kb_dev = get_khata_action_keyboard("token123", 1350.0, "http://localhost:8000/pay/token123")
    assert any("khata:pay_info:" in (btn.callback_data or "") for row in khata_kb_dev.inline_keyboard for btn in row)

    # Deadline keyboard
    deadline_kb = get_deadline_selection_keyboard()
    dl_callbacks = [btn.callback_data for row in deadline_kb.inline_keyboard for btn in row if btn.callback_data]
    assert "deadline:1_day" in dl_callbacks
    assert "deadline:3_days" in dl_callbacks
    assert "deadline:7_days" in dl_callbacks

    # Offers keyboard
    offers_kb = get_offers_keyboard()
    assert len(offers_kb.inline_keyboard) >= 2

    # Escalation keyboard
    esc_kb = get_escalation_keyboard("+91 91675 86024")
    assert any("contact:call_info" in (btn.callback_data or "") for row in esc_kb.inline_keyboard for btn in row)
    assert any("wa.me" in (btn.url or "") for row in esc_kb.inline_keyboard for btn in row)


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
async def test_store_sales_and_discounts(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify ongoing sales and discounts handler."""
    mock_answer = AsyncMock()
    monkeypatch.setattr(Message, "answer", mock_answer)

    message = Message(
        message_id=2,
        date=datetime.datetime.now(),
        chat=Chat(id=123, type="private"),
        text="🏷️ Dukaan Ke Offers & Sales",
    )

    await handle_store_sales_and_discounts(message)
    mock_answer.assert_called_once()
    args, _ = mock_answer.call_args
    assert "Ongoing Sales & Discounts" in args[0]
    assert "12% OFF" in args[0]


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
async def test_khata_handler_with_partial_payment(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify khata outstanding balance query with partial payment and remaining balance."""
    mock_db = MagicMock()
    mock_customers = MagicMock()
    mock_customers.find_one = AsyncMock(return_value={"_id": "cust_sharma_001", "name": "Sunita Patil"})

    class AsyncEntryCursor:
        def __init__(self) -> None:
            self.docs = [{
                "amount_total_paise": 185000,
                "amount_paid_paise": 50000,
                "due_date": datetime.date(2026, 10, 5),
                "items": "Oil, Atta, Ghee",
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
        text="🧾 Mera Khata & Bill (Udhaar)",
    )

    await handle_my_khata(message)
    mock_answer.assert_called_once()
    args, kwargs = mock_answer.call_args
    # Verify Kul bill, Jama (paid), and Baaki (remaining balance) are reported
    assert "₹1850" in args[0]
    assert "₹500" in args[0]
    assert "₹1350" in args[0]
    assert kwargs.get("reply_markup") is not None


@pytest.mark.asyncio
async def test_pay_now_qr_and_link(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify pay now presents QR code and direct payment link."""
    mock_db = MagicMock()
    mock_customers = MagicMock()
    mock_customers.find_one = AsyncMock(return_value={"_id": "cust_sharma_001", "name": "Sunita Patil"})

    class AsyncEntryCursor:
        def __init__(self) -> None:
            self.docs = [{
                "amount_total_paise": 135000,
                "amount_paid_paise": 0,
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

    mock_db.customers = mock_customers
    mock_db.khata_entries = MagicMock(find=MagicMock(return_value=AsyncEntryCursor()))
    mock_db.payments = MagicMock(update_one=AsyncMock())
    monkeypatch.setattr("vyom.bot.handlers.khata.get_db", lambda: mock_db)

    mock_photo = AsyncMock()
    monkeypatch.setattr(Message, "answer_photo", mock_photo)

    message = Message(
        message_id=10,
        date=datetime.datetime.now(),
        chat=Chat(id=987654321, type="private"),
        from_user=User(id=987654321, is_bot=False, first_name="Sunita"),
        text="💳 Abhi Pay Karein (Pay Now / QR)",
    )

    await handle_pay_now_direct(message)
    mock_photo.assert_called_once()
    kwargs = mock_photo.call_args.kwargs
    assert kwargs.get("photo") is not None
    assert "₹1350" in kwargs.get("caption", "")


@pytest.mark.asyncio
async def test_deadline_setting(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify customer setting payment deadline updates khata entry promise date."""
    mock_db = MagicMock()
    mock_customers = MagicMock()
    mock_customers.find_one = AsyncMock(return_value={"_id": "cust_sharma_001", "name": "Sunita Patil"})
    mock_khata = MagicMock()
    mock_khata.find = MagicMock(return_value=MagicMock(__aiter__=lambda self: self, __anext__=AsyncMock(side_effect=StopAsyncIteration)))
    mock_khata.update_many = AsyncMock()

    mock_db.customers = mock_customers
    mock_db.khata_entries = mock_khata
    mock_db.payments = MagicMock(update_one=AsyncMock())
    monkeypatch.setattr("vyom.bot.handlers.khata.get_db", lambda: mock_db)

    mock_cb_answer = AsyncMock()
    monkeypatch.setattr(CallbackQuery, "answer", mock_cb_answer)
    mock_msg_answer = AsyncMock()
    monkeypatch.setattr(Message, "answer", mock_msg_answer)

    dummy_msg = Message(message_id=20, date=datetime.datetime.now(), chat=Chat(id=1, type="private"), text="Select")
    query = CallbackQuery(
        id="cb_dl",
        from_user=User(id=987654321, is_bot=False, first_name="Sunita"),
        chat_instance="inst_dl",
        data="deadline:3_days",
        message=dummy_msg,
    )

    await handle_deadline_selection(query)
    mock_khata.update_many.assert_called_once()
    mock_msg_answer.assert_called_once()
    args, _ = mock_msg_answer.call_args
    assert "Payment Deadline Safalta-purvak Set Ho Gayi" in args[0]


@pytest.mark.asyncio
async def test_unrecognized_query_escalation(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify random user questions are politely escalated to merchant."""
    mock_db = MagicMock()
    mock_merchants = MagicMock()
    mock_merchants.find_one = AsyncMock(return_value={"_id": "merchant_sharma_01", "name": "Sharma Kirana Store", "phone_e164": "+91 91675 86024", "owner_name": "Ramesh Sharma"})
    mock_customers = MagicMock()
    mock_customers.find_one = AsyncMock(return_value={"_id": "cust_sharma_001"})
    mock_escalations = MagicMock()
    mock_escalations.insert_one = AsyncMock()

    mock_db.merchants = mock_merchants
    mock_db.customers = mock_customers
    mock_db.support_escalations = mock_escalations
    monkeypatch.setattr("vyom.bot.handlers.catalog.get_db", lambda: mock_db)

    mock_answer = AsyncMock()
    monkeypatch.setattr(Message, "answer", mock_answer)

    message = Message(
        message_id=30,
        date=datetime.datetime.now(),
        chat=Chat(id=987654321, type="private"),
        from_user=User(id=987654321, is_bot=False, first_name="Sunita"),
        text="Aapke paas bread aur eggs milenge kya?",
    )

    await handle_unrecognized_query_escalation(message)
    mock_escalations.insert_one.assert_called_once()
    mock_answer.assert_called_once()
    args, _ = mock_answer.call_args
    assert "Kshama karein" in args[0]
    assert "Ramesh Sharma" in args[0]
    assert "+91 91675 86024" in args[0]


@pytest.mark.asyncio
async def test_contact_store_handler(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify contact store handler displays merchant info."""
    mock_db = MagicMock()
    mock_merchants = MagicMock()
    mock_merchants.find_one = AsyncMock(return_value={"_id": "merchant_sharma_01", "phone_e164": "+91 91675 86024", "owner_name": "Ramesh Sharma"})
    mock_db.merchants = mock_merchants
    monkeypatch.setattr("vyom.bot.handlers.catalog.get_db", lambda: mock_db)

    mock_answer = AsyncMock()
    monkeypatch.setattr(Message, "answer", mock_answer)
    mock_contact = AsyncMock()
    monkeypatch.setattr(Message, "answer_contact", mock_contact)

    message = Message(
        message_id=40,
        date=datetime.datetime.now(),
        chat=Chat(id=1, type="private"),
        from_user=User(id=1, is_bot=False, first_name="Customer"),
        text="📞 Dukaan Se Baat Karein (Support)",
    )

    await handle_contact_store(message)
    mock_answer.assert_called_once()
    mock_contact.assert_called_once()
    contact_kwargs = mock_contact.call_args.kwargs
    assert contact_kwargs.get("phone_number") == "+919167586024"
    assert "Ramesh Sharma" in contact_kwargs.get("first_name", "")
    args, _ = mock_answer.call_args
    assert "Ramesh Sharma" in args[0]
    assert "+91 91675 86024" in args[0]


@pytest.mark.asyncio
async def test_call_info_shares_contact_component(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify selecting call store sends native Telegram Contact component."""
    from vyom.bot.handlers.catalog import handle_call_info

    mock_db = MagicMock()
    mock_merchants = MagicMock()
    mock_merchants.find_one = AsyncMock(return_value={"_id": "merchant_sharma_01", "phone_e164": "+91 91675 86024", "owner_name": "Ramesh Sharma"})
    mock_db.merchants = mock_merchants
    monkeypatch.setattr("vyom.bot.handlers.catalog.get_db", lambda: mock_db)

    mock_cb_answer = AsyncMock()
    monkeypatch.setattr(CallbackQuery, "answer", mock_cb_answer)
    mock_contact = AsyncMock()
    monkeypatch.setattr(Message, "answer_contact", mock_contact)

    dummy_msg = Message(message_id=50, date=datetime.datetime.now(), chat=Chat(id=1, type="private"), text="Contact")
    query = CallbackQuery(
        id="cb_call",
        from_user=User(id=1, is_bot=False, first_name="Customer"),
        chat_instance="inst_call",
        data="contact:call_info",
        message=dummy_msg,
    )

    await handle_call_info(query)
    mock_contact.assert_called_once()
    contact_kwargs = mock_contact.call_args.kwargs
    assert contact_kwargs.get("phone_number") == "+919167586024"
    assert "Ramesh Sharma" in contact_kwargs.get("first_name", "")
    assert contact_kwargs.get("vcard") is not None


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


@pytest.mark.asyncio
async def test_khata_photo_upload_ocr(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify uploaded photo is parsed by Sarvam Document AI OCR and structured rows saved."""
    mock_db = MagicMock()
    mock_scans = MagicMock()
    mock_scans.insert_one = AsyncMock()
    mock_db.khata_scans = mock_scans
    monkeypatch.setattr("vyom.bot.handlers.khata.get_db", lambda: mock_db)

    mock_ocr = MagicMock()
    mock_ocr.extract_khata_rows = AsyncMock(
        return_value={
            "rows": [
                {
                    "customer_name": "Rohan Gupta",
                    "amount_paise": 65000,
                    "entry_type": "credit_given",
                    "items_summary": "cooking oil, spices",
                },
                {
                    "customer_name": "Sunita Patil",
                    "amount_paise": 120000,
                    "entry_type": "credit_given",
                    "items_summary": "5kg Atta, 2L Oil",
                },
            ]
        }
    )
    monkeypatch.setattr("vyom.bot.handlers.khata.get_ocr_client", lambda: mock_ocr)

    mock_status_msg = AsyncMock()
    mock_answer = AsyncMock(return_value=mock_status_msg)
    monkeypatch.setattr(Message, "answer", mock_answer)

    mock_bot = MagicMock()
    mock_bot.get_file = AsyncMock(
        return_value=TgFile(file_id="p123", file_unique_id="pu123", file_path="photos/p123.jpg")
    )
    mock_bot.download_file = AsyncMock()

    photo_size = PhotoSize(file_id="p123", file_unique_id="pu123", width=100, height=100)
    message = Message(
        message_id=10,
        date=datetime.datetime.now(),
        chat=Chat(id=111, type="private"),
        photo=[photo_size],
    ).as_(mock_bot)

    await handle_khata_photo_upload(message)

    mock_answer.assert_called_once()
    mock_status_msg.edit_text.assert_called_once()
    edit_args, _ = mock_status_msg.edit_text.call_args
    assert "Sarvam Document Intelligence OCR" in edit_args[0]
    assert "Rohan Gupta" in edit_args[0]
    assert "Sunita Patil" in edit_args[0]
    assert "1,850" in edit_args[0]
    mock_scans.insert_one.assert_called_once()


@pytest.mark.asyncio
async def test_khata_document_upload_ocr(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify uploaded PDF document is parsed by Sarvam Document AI OCR and structured."""
    mock_db = MagicMock()
    mock_scans = MagicMock()
    mock_scans.insert_one = AsyncMock()
    mock_db.khata_scans = mock_scans
    monkeypatch.setattr("vyom.bot.handlers.khata.get_db", lambda: mock_db)

    mock_ocr = MagicMock()
    mock_ocr.extract_khata_rows = AsyncMock(
        return_value={
            "rows": [
                {
                    "customer_name": "Meena Joshi",
                    "amount_paise": 30000,
                    "entry_type": "payment_received",
                    "items_summary": "cash received",
                }
            ]
        }
    )
    monkeypatch.setattr("vyom.bot.handlers.khata.get_ocr_client", lambda: mock_ocr)

    mock_status_msg = AsyncMock()
    mock_answer = AsyncMock(return_value=mock_status_msg)
    monkeypatch.setattr(Message, "answer", mock_answer)

    mock_bot = MagicMock()
    mock_bot.get_file = AsyncMock(
        return_value=TgFile(file_id="doc123", file_unique_id="docu123", file_path="docs/register.pdf")
    )
    mock_bot.download_file = AsyncMock()

    doc = Document(file_id="doc123", file_unique_id="docu123", file_name="register.pdf", mime_type="application/pdf")
    message = Message(
        message_id=11,
        date=datetime.datetime.now(),
        chat=Chat(id=111, type="private"),
        document=doc,
    ).as_(mock_bot)

    await handle_khata_document_upload(message)

    mock_answer.assert_called_once()
    mock_status_msg.edit_text.assert_called_once()
    edit_args, _ = mock_status_msg.edit_text.call_args
    assert "Document Digitize Hua" in edit_args[0]
    assert "Meena Joshi" in edit_args[0]
    assert "300" in edit_args[0]
    mock_scans.insert_one.assert_called_once()

