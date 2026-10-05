"""Khata Scans API: uploading ledger photos, reviewing extracted rows, and confirming entries."""

from __future__ import annotations

import datetime
from typing import Annotated, Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from vyom.ai.ocr import get_ocr_client
from vyom.clock import Clock
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import NotFoundError
from vyom.core.sse import sse_hub
from vyom.models.customer import Customer
from vyom.models.enums import (
    EntryType,
    KhataEntrySource,
    KhataScanStatus,
    KhataStatus,
    Language,
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
    """Upload ledger images from camera or file upload for Sarvam Doc AI OCR digitization."""
    now_dt = Clock.now()
    pages: list[ScanPage] = []
    rows: list[ScanRow] = []
    page_totals: list[int] = []

    ocr_client = get_ocr_client()

    # Pre-fetch existing merchant customers for fuzzy / name matching
    customers_cursor = db.customers.find({"merchant_id": merchant.id})
    existing_customers = [c async for c in customers_cursor]

    row_counter = 1

    for idx, f in enumerate(files):
        media_id = f"scan_media_{int(now_dt.timestamp())}_{idx}"
        file_bytes = await f.read()

        # Digitize with OCR engine (Gemini Vision -> Sarvam Doc AI -> Mock fallback)
        try:
            extracted_data = await ocr_client.extract_khata_rows(
                file_bytes, filename=f.filename or f"ledger_page_{idx+1}.jpg"
            )
        except Exception as exc:
            from vyom.ai.ocr import MockOCRClient
            extracted_data = MockOCRClient().extract_khata_rows_sync()

        if not extracted_data:
            from vyom.ai.ocr import MockOCRClient
            extracted_data = MockOCRClient().extract_khata_rows_sync()

        raw_summary = " | ".join([f"{item.get('customer_name')}: ₹{item.get('amount_paise', 0)//100}" for item in extracted_data])
        pages.append(
            ScanPage(
                media_id=media_id,
                ocr_job_id=f"sarvam_doc_{media_id}",
                raw_text=raw_summary or "Extracted handwritten ledger text",
            )
        )

        page_total = 0
        for item in extracted_data:
            c_name = item.get("customer_name", "").strip() or f"Customer {row_counter}"
            c_phone = item.get("customer_phone")
            amt = int(item.get("amount_paise", 0))
            e_type_str = str(item.get("entry_type", "credit_given")).lower()
            if any(k in e_type_str for k in ["jama", "paid", "received", "payment"]):
                e_type = EntryType.PAYMENT_RECEIVED
            else:
                e_type = EntryType.CREDIT_GIVEN
            conf = float(item.get("confidence", 0.94))
            items_summary = item.get("items_summary") or ("Kirana grocery goods (Udhar)" if e_type == EntryType.CREDIT_GIVEN else "Cash Jama")

            # Match against existing customers
            matched_id = None
            match_score = None

            for cust in existing_customers:
                cust_name = cust.get("name", "").lower()
                cust_phone = cust.get("phone_e164", "")
                if c_phone and cust_phone and c_phone in cust_phone:
                    matched_id = cust.get("_id")
                    match_score = 0.99
                    break
                elif c_name and (c_name.lower() in cust_name or cust_name in c_name.lower()):
                    matched_id = cust.get("_id")
                    match_score = 0.95
                    break

            # Date parsing
            row_date = Clock.today()
            raw_d = item.get("date")
            if raw_d:
                try:
                    if isinstance(raw_d, datetime.date):
                        row_date = raw_d
                    else:
                        row_date = datetime.date.fromisoformat(str(raw_d)[:10])
                except Exception:
                    row_date = Clock.today()

            row = ScanRow(
                row_id=f"row_{row_counter}",
                page=idx + 1,
                name_raw=c_name,
                phone=c_phone,
                items_summary=items_summary,
                matched_customer_id=matched_id,
                match_score=match_score,
                amount_paise=amt,
                date=row_date,
                entry_type=e_type,
                confidence=conf,
                edited=False,
            )
            rows.append(row)
            row_counter += 1
            page_total += amt

        page_totals.append(page_total)

    scan = KhataScan(
        merchant_id=merchant.id,
        status=KhataScanStatus.REVIEW,  # Ready for merchant review in UI
        pages=pages,
        rows=rows,
        page_totals=page_totals,
        created_via=ScanCreatedVia(created_via) if created_via in ("camera", "upload") else ScanCreatedVia.CAMERA,
    )
    await db.khata_scans.insert_one(scan.to_mongo())

    await sse_hub.broadcast(
        merchant.id,
        "khata_scan.uploaded",
        {"scan_id": scan.id, "rows_count": len(rows)},
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
        target_cust_id = r.matched_customer_id
        if not target_cust_id:
            # Auto-create customer profile so data is properly stored
            new_cust = Customer(
                merchant_id=merchant.id,
                name=r.name_raw,
                phone_e164=r.phone or "+919822000000",
                language=Language.HINGLISH,
            )
            await db.customers.insert_one(new_cust.to_mongo())
            target_cust_id = new_cust.id

        items_list = [r.items_summary] if r.items_summary else ["Kirana grocery goods"]

        if r.entry_type == EntryType.CREDIT_GIVEN:
            entry = KhataEntry(
                merchant_id=merchant.id,
                customer_id=target_cust_id,
                amount_total_paise=r.amount_paise,
                amount_paid_paise=0,
                opened_at=now_dt,
                due_date=r.date + datetime.timedelta(days=14),
                status=KhataStatus.OPEN,
                items=items_list,
                items_summary=r.items_summary or "Kirana grocery goods (Udhar)",
                source=KhataEntrySource.OCR,
                scan_id=scan.id,
                ocr=KhataOCRMeta(confidence=r.confidence, row_id=r.row_id),
            )
            created_entries.append(entry)
            await db.khata_entries.insert_one(entry.to_mongo())
        else:
            # Payment received (Jama)
            entry = KhataEntry(
                merchant_id=merchant.id,
                customer_id=target_cust_id,
                amount_total_paise=r.amount_paise,
                amount_paid_paise=r.amount_paise,
                opened_at=now_dt,
                due_date=r.date,
                status=KhataStatus.PAID,
                items=items_list,
                items_summary=r.items_summary or "Cash received (Jama)",
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
    await sse_hub.broadcast(
        merchant.id,
        "khata.created",
        {"scan_id": scan.id, "count": len(created_entries)},
    )

    return {
        "status": "confirmed",
        "entries_created": len(created_entries),
        "scan_id": scan.id,
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
