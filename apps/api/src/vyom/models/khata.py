"""Khata ledger entries and OCR scan models."""

from __future__ import annotations

import datetime

from pydantic import BaseModel, Field

from vyom.models.base import MongoModel
from vyom.models.enums import (
    EntryType,
    KhataEntrySource,
    KhataScanStatus,
    KhataStatus,
    RowFlag,
    ScanCreatedVia,
)


class KhataReminder(BaseModel):
    """Log of a reminder sent to the customer for overdue udhaar."""

    sent_at: datetime.datetime
    tone: str = "gentle"  # gentle, firm, festival_courtesy
    message_id: str | None = None
    delivery_status: str = "delivered"


class KhataOCRMeta(BaseModel):
    """Traceability back to scan document and row."""

    confidence: float
    row_id: str


class KhataEntry(MongoModel):
    """Udhaar / credit entry for a customer."""

    merchant_id: str
    customer_id: str
    amount_total_paise: int
    amount_paid_paise: int = 0
    opened_at: datetime.datetime
    due_date: datetime.date
    status: KhataStatus = KhataStatus.OPEN
    promise_date: datetime.date | None = None
    reminders: list[KhataReminder] = Field(default_factory=list)
    source: KhataEntrySource = KhataEntrySource.MANUAL
    scan_id: str | None = None
    ocr: KhataOCRMeta | None = None
    last_reminder_at: datetime.datetime | None = None
    version: int = 1


class ScanPageQuality(BaseModel):
    """Quality metrics of an uploaded page image."""

    blur: float = 0.0
    brightness: float = 0.0
    warnings: list[str] = Field(default_factory=list)


class ScanPage(BaseModel):
    """Individual page of a handwritten khata book."""

    media_id: str
    ocr_job_id: str | None = None
    raw_text: str | None = None
    quality: ScanPageQuality = Field(default_factory=ScanPageQuality)


class ScanRow(BaseModel):
    """Extracted row from a khata page."""

    row_id: str
    page: int
    name_raw: str
    matched_customer_id: str | None = None
    match_score: float | None = None
    amount_paise: int
    date: datetime.date
    entry_type: EntryType = EntryType.CREDIT_GIVEN
    confidence: float = 1.0
    flags: list[RowFlag] = Field(default_factory=list)
    edited: bool = False


class KhataScan(MongoModel):
    """OCR scan session for ledger digitisation."""

    merchant_id: str
    status: KhataScanStatus = KhataScanStatus.UPLOADED
    pages: list[ScanPage] = Field(default_factory=list)
    rows: list[ScanRow] = Field(default_factory=list)
    page_totals: list[int] = Field(default_factory=list)
    created_via: ScanCreatedVia = ScanCreatedVia.CAMERA
    confirmed_at: datetime.datetime | None = None
    retention_until: datetime.datetime | None = None
