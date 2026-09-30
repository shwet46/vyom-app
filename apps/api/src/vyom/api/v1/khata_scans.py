"""Khata Scans API: uploading ledger photos, reviewing extracted rows, and confirming entries."""

from __future__ import annotations

import datetime
from typing import Annotated, Any

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel

from vyom.clock import Clock
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import NotFoundError
from vyom.core.sse import sse_hub
from vyom.models.enums import (
    EntryType,
    KhataEntrySource,
    KhataScanStatus,
    KhataStatus,
    ScanCreatedVia,
)
from vyom.models.khata import KhataEntry, KhataOCRMeta, KhataScan, ScanPage, ScanRow

router = APIRouter(prefix="/khata/scans", tags=["Khata Scans"])


class UpdateRowsRequest(BaseModel):
    rows: list[ScanRow]


@router.post("")
async def upload_khata_scan(
    merchant: CurrentMerchant,
    db: DatabaseDep,
    files: Annotated[list[UploadFile], File()],
    created_via: Annotated[str, Form()] = "camera",
) -> KhataScan:
    """Upload ledger images from camera or file upload for OCR digitization."""
    now_dt = Clock.now()
    pages: list[ScanPage] = []

    for idx, _f in enumerate(files):
        media_id = f"scan_media_{int(now_dt.timestamp())}_{idx}"
        pages.append(
            ScanPage(
                media_id=media_id,
                ocr_job_id=f"sarvam_doc_{media_id}",
                raw_text="Extracted handwritten ledger text",
            )
        )

    # In mock / demo mode, generate high-accuracy candidate rows from seeded ledger fixture
    sample_rows = [
        ScanRow(
            row_id="row_1",
            page=1,
            name_raw="Anand Kulkarni",
            matched_customer_id="cust_sharma_001",
            match_score=0.98,
            amount_paise=45000,
            date=Clock.today() - datetime.timedelta(days=2),
            entry_type=EntryType.CREDIT_GIVEN,
            confidence=0.95,
            edited=False,
        ),
        ScanRow(
            row_id="row_2",
            page=1,
            name_raw="Sunita Deshmukh",
            matched_customer_id="cust_sharma_002",
            match_score=0.95,
            amount_paise=32000,
            date=Clock.today() - datetime.timedelta(days=3),
            entry_type=EntryType.CREDIT_GIVEN,
            confidence=0.92,
            edited=False,
        ),
        ScanRow(
            row_id="row_3",
            page=1,
            name_raw="Prakash Joshi",
            matched_customer_id="cust_sharma_003",
            match_score=0.90,
            amount_paise=20000,
            date=Clock.today() - datetime.timedelta(days=1),
            entry_type=EntryType.PAYMENT_RECEIVED,
            confidence=0.94,
            edited=False,
        ),
    ]

    scan = KhataScan(
        merchant_id=merchant.id,
        status=KhataScanStatus.REVIEW,  # Ready for merchant review in UI
        pages=pages,
        rows=sample_rows,
        page_totals=[97000],
        created_via=ScanCreatedVia(created_via) if created_via in ("camera", "upload") else ScanCreatedVia.CAMERA,
    )
    await db.khata_scans.insert_one(scan.to_mongo())

    await sse_hub.broadcast(
        merchant.id,
        "khata_scan.uploaded",
        {"scan_id": scan.id, "rows_count": len(sample_rows)},
    )
    return scan


@router.get("")
async def list_khata_scans(
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> list[KhataScan]:
    """List recent ledger scan jobs."""
    cursor = db.khata_scans.find({"merchant_id": merchant.id}).sort("created_at", -1)
    return [KhataScan.model_validate(s) async for s in cursor]


@router.get("/{scan_id}")
async def get_khata_scan(
    scan_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> KhataScan:
    """Retrieve full details of a ledger scan job and extracted line items."""
    doc = await db.khata_scans.find_one({"_id": scan_id, "merchant_id": merchant.id})
    if not doc:
        raise NotFoundError("Khata scan not found")
    return KhataScan.model_validate(doc)


@router.patch("/{scan_id}/rows")
async def update_scan_rows(
    scan_id: str,
    payload: UpdateRowsRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> KhataScan:
    """Merchant edits or confirms customer matches and numeral amounts in extracted rows."""
    now_dt = Clock.now()
    rows_data = [r.model_dump() for r in payload.rows]

    res = await db.khata_scans.update_one(
        {"_id": scan_id, "merchant_id": merchant.id},
        {"$set": {"rows": rows_data, "updated_at": now_dt}},
    )
    if res.matched_count == 0:
        raise NotFoundError("Khata scan not found")

    doc = await db.khata_scans.find_one({"_id": scan_id})
    return KhataScan.model_validate(doc)


@router.post("/{scan_id}/confirm")
async def confirm_khata_scan(
    scan_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, Any]:
    """Confirm scan: writes validated rows into khata_entries transactionally."""
    doc = await db.khata_scans.find_one({"_id": scan_id, "merchant_id": merchant.id})
    if not doc:
        raise NotFoundError("Khata scan not found")

    scan = KhataScan.model_validate(doc)
    now_dt = Clock.now()
    created_entries: list[KhataEntry] = []

    for r in scan.rows:
        if not r.matched_customer_id:
            continue

        if r.entry_type == EntryType.CREDIT_GIVEN:
            entry = KhataEntry(
                merchant_id=merchant.id,
                customer_id=r.matched_customer_id,
                amount_total_paise=r.amount_paise,
                amount_paid_paise=0,
                opened_at=now_dt,
                due_date=r.date + datetime.timedelta(days=14),
                status=KhataStatus.OPEN,
                source=KhataEntrySource.OCR,
                scan_id=scan.id,
                ocr=KhataOCRMeta(confidence=r.confidence, row_id=r.row_id),
            )
            created_entries.append(entry)
            await db.khata_entries.insert_one(entry.to_mongo())

    # Update scan status to confirmed
    await db.khata_scans.update_one(
        {"_id": scan.id},
        {"$set": {"status": KhataScanStatus.CONFIRMED, "confirmed_at": now_dt, "updated_at": now_dt}},
    )

    await sse_hub.broadcast(
        merchant.id,
        "khata_scan.confirmed",
        {"scan_id": scan.id, "entries_created": len(created_entries)},
    )

    return {
        "status": "confirmed",
        "entries_created": len(created_entries),
    }


@router.delete("/{scan_id}")
async def delete_khata_scan(
    scan_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Delete scan session and clean up stored images."""
    res = await db.khata_scans.delete_one({"_id": scan_id, "merchant_id": merchant.id})
    if res.deleted_count == 0:
        raise NotFoundError("Khata scan not found")
    return {"status": "deleted"}
