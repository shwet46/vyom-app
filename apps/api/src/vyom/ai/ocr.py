"""Handwritten Khata Ledger OCR client: Sarvam Document AI and deterministic Mock."""

from __future__ import annotations

import asyncio
import datetime
import io
import json
import re
import zipfile
from abc import ABC, abstractmethod
from html.parser import HTMLParser
from typing import Any

import httpx
import structlog

from vyom.clock import Clock
from vyom.config import Settings, get_settings

logger = structlog.get_logger()


class TableParser(HTMLParser):
    """Extract rows and cells from HTML table elements."""

    def __init__(self) -> None:
        super().__init__()
        self.rows: list[list[str]] = []
        self.current_row: list[str] = []
        self.current_cell: list[str] = []
        self.in_cell: bool = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in ("td", "th"):
            self.in_cell = True
            self.current_cell = []
        elif tag == "tr":
            self.current_row = []

    def handle_endtag(self, tag: str) -> None:
        if tag in ("td", "th"):
            self.in_cell = False
            cell_text = " ".join(self.current_cell).strip()
            self.current_row.append(cell_text)
        elif tag == "tr":
            if any(c for c in self.current_row):
                self.rows.append(self.current_row)

    def handle_data(self, data: str) -> None:
        if self.in_cell:
            cleaned = data.strip()
            if cleaned:
                self.current_cell.append(cleaned)


class BaseOCRClient(ABC):
    """Abstract interface for extracting structured ledger transactions from notebook photos."""

    @abstractmethod
    async def extract_khata_rows(
        self,
        image_bytes: bytes,
        filename: str = "ledger.jpg",
    ) -> list[dict[str, Any]]:
        """Extract structured ledger rows from an image."""


class SarvamDocOCRClient(BaseOCRClient):
    """Production client calling Sarvam Document AI for ledger digitization.

    Flow:
    1. Submit job via POST /doc-ai/v1/job/digitise (multipart)
    2. Poll status via GET /doc-ai/v1/job/{job_id}/status until terminal status
    3. Retrieve output URL via GET /doc-ai/v1/job/{job_id}/download-url
    4. Download output zip and extract HTML + page metadata JSON
    5. Parse and structure the raw handwritten/printed ledger into validated khata rows
    """

    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.sarvam_base_url.rstrip("/")
        self.api_key = settings.sarvam_api_key

    async def extract_khata_rows(
        self,
        image_bytes: bytes,
        filename: str = "ledger.jpg",
    ) -> list[dict[str, Any]]:
        """Digitize document image using Sarvam Doc AI and extract structured ledger line items."""
        submit_url = f"{self.base_url}/doc-ai/v1/job/digitise"
        headers = {"api-subscription-key": self.api_key}

        # Determine mime type
        lower_name = filename.lower()
        if lower_name.endswith(".pdf"):
            content_type = "application/pdf"
        elif lower_name.endswith(".png"):
            content_type = "image/png"
        elif lower_name.endswith((".webp", ".tif", ".tiff")):
            content_type = "image/webp"
        else:
            content_type = "image/jpeg"

        files = {"file": (filename, image_bytes, content_type)}
        data = {
            "language": "hi-IN",
            "output_format": "json",
            "content_type": "handwritten",
            "auto_orient": "true",
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                # 1. Submit digitise job
                logger.info("sarvam_doc_ai_job_submitting", filename=filename, size_bytes=len(image_bytes))
                submit_res = await client.post(submit_url, headers=headers, files=files, data=data)
                if submit_res.status_code not in (200, 201):
                    logger.error(
                        "sarvam_doc_ai_submit_failed",
                        status=submit_res.status_code,
                        text=submit_res.text[:500],
                    )
                    submit_res.raise_for_status()

                submit_json = submit_res.json()
                job_id = submit_json.get("job_id")
                if not job_id:
                    raise ValueError(f"No job_id returned by Sarvam Document AI: {submit_json}")

                logger.info("sarvam_doc_ai_job_created", job_id=job_id)

                # 2. Poll until terminal status
                terminal = {"completed", "partially_completed", "failed", "rejected"}
                max_polls = 45  # up to 90 seconds
                last_status = "pending"

                for poll_num in range(max_polls):
                    await asyncio.sleep(2)
                    status_res = await client.get(
                        f"{self.base_url}/doc-ai/v1/job/{job_id}/status",
                        headers=headers,
                        timeout=30.0,
                    )
                    if status_res.status_code == 200:
                        status_json = status_res.json()
                        last_status = status_json.get("status", "unknown")
                        usage = status_json.get("usage", {})
                        logger.info(
                            "sarvam_doc_ai_poll",
                            job_id=job_id,
                            status=last_status,
                            pages_processed=usage.get("pages_processed"),
                            pages_total=usage.get("pages_total"),
                            poll=poll_num + 1,
                        )
                        if last_status in terminal:
                            break

                if last_status in {"failed", "rejected"}:
                    raise RuntimeError(f"Sarvam Doc AI job failed with status: {last_status}")

                # 3. Mint download URL for output zip (with retry to allow blob finalize)
                link_data: dict[str, Any] = {}
                for dl_attempt in range(6):
                    await asyncio.sleep(1.5)
                    link_res = await client.get(
                        f"{self.base_url}/doc-ai/v1/job/{job_id}/download-url",
                        headers=headers,
                        timeout=30.0,
                    )
                    if link_res.status_code == 200:
                        link_data = link_res.json()
                        break
                    elif dl_attempt == 5:
                        link_res.raise_for_status()

                dl_url = link_data.get("url")
                dl_headers = link_data.get("headers") or {}

                # 4. Fetch the rendered zip archive
                zip_res = await client.get(dl_url, headers=dl_headers, timeout=120.0)
                zip_res.raise_for_status()
                zip_bytes = zip_res.content

                # 5. Extract HTML, page JSON metadata, and raw text from output zip
                raw_texts: list[str] = []
                html_contents: list[str] = []

                with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
                    for name in z.namelist():
                        file_data = z.read(name).decode("utf-8", errors="ignore")
                        if name.endswith(".html"):
                            html_contents.append(file_data)
                        elif name.endswith((".json", ".md", ".txt")):
                            try:
                                if name.endswith(".json"):
                                    raw_texts.extend(self._collect_ocr_text(json.loads(file_data)))
                                else:
                                    raw_texts.append(file_data)
                            except (json.JSONDecodeError, UnicodeDecodeError):
                                continue

                # 6. Structure extracted content into ledger line rows
                structured_rows = self._structure_ledger_rows(raw_texts, html_contents)
                logger.info(
                    "sarvam_doc_ai_rows_extracted",
                    job_id=job_id,
                    rows_count=len(structured_rows),
                )
                return structured_rows

            except Exception as exc:
                logger.warning("sarvam_doc_ai_pipeline_failed", error=str(exc))
                raise RuntimeError(f"Sarvam Document AI failed: {exc}") from exc

    def _collect_ocr_text(self, value: Any) -> list[str]:
        """Collect text from Sarvam JSON regardless of page/blocks nesting."""
        if isinstance(value, str):
            return [value.strip()] if value.strip() else []
        if isinstance(value, list):
            text: list[str] = []
            for item in value:
                text.extend(self._collect_ocr_text(item))
            return text
        if not isinstance(value, dict):
            return []

        text: list[str] = []
        for key, child in value.items():
            if (key in {"text", "content"} and isinstance(child, str)) or key not in {
                "bbox",
                "bounding_box",
                "coordinates",
            }:
                text.extend(self._collect_ocr_text(child))
        return text

    def _structure_ledger_rows(
        self,
        raw_texts: list[str],
        html_contents: list[str],
    ) -> list[dict[str, Any]]:
        """Parse raw text blocks and HTML tables into validated ledger transaction rows."""
        rows: list[dict[str, Any]] = []

        # 1. Parse tables from HTML if available
        for html in html_contents:
            clean_html_for_table = re.sub(r"<style[\s\S]*?</style>", "", html, flags=re.IGNORECASE)
            parser = TableParser()
            try:
                parser.feed(clean_html_for_table)
                for tr in parser.rows:
                    if len(tr) >= 2:
                        parsed = self._parse_table_row(tr)
                        if parsed:
                            rows.append(parsed)
            except Exception:
                pass

        # 2. Parse text blocks (metadata blocks have pure text without HTML/CSS)
        if raw_texts:
            combined_text = "\n".join(raw_texts)
        else:
            # Fallback to HTML body only with style and script tags stripped
            combined_text = ""
            for html in html_contents:
                no_style = re.sub(r"<(style|script)[\s\S]*?</\1>", "", html, flags=re.IGNORECASE)
                clean_body = re.sub(r"<[^>]+>", "\n", no_style)
                combined_text += "\n" + clean_body

        lines = [line.strip() for line in combined_text.split("\n") if line.strip()]
        for line in lines:
            # Skip obvious CSS/header artifacts
            if any(skip in line.lower() for skip in ["page", "khata", "register", "total", "subtotal", "date /", "!important", "margin", "padding", "border"]):
                continue
            parsed = self._parse_text_line(line)
            if (
                parsed
                and parsed.get("amount_paise", 0) > 0
                and not any(
                    r["customer_name"].lower() == parsed["customer_name"].lower()
                    and r["amount_paise"] == parsed["amount_paise"]
                    for r in rows
                )
            ):
                rows.append(parsed)

        return rows

    def _parse_table_row(self, cells: list[str]) -> dict[str, Any] | None:
        """Parse structured HTML table row cells."""
        # Find cell with amount
        amount_paise = 0
        name = ""
        items = ""
        entry_type = "credit_given"
        date_str = Clock.today().isoformat()

        for c in cells:
            clean_cell = self._normalize_digits(c.strip())
            # Check for amount
            amt_match = re.search(r"(?:rs\.?|inr|₹)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*(?:rs\.?|/-|rupees|रुपये)?", clean_cell, re.IGNORECASE)
            # Check for date
            date_match = re.search(r"(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})", clean_cell)
            if date_match:
                date_str = date_match.group(1)

            # Check for payment vs credit
            if re.search(r"(जमा|paid|received|diye|cash|रोकड़)", clean_cell, re.IGNORECASE):
                entry_type = "payment_received"

            if amt_match and not amount_paise:
                amount_paise = self._amount_to_paise(amt_match.group(1))
            elif not name and len(clean_cell) >= 3 and not re.match(r"^\d+$", clean_cell):
                name = clean_cell
            elif name and not items:
                items = clean_cell

        if amount_paise > 0 and name:
            return {
                "customer_name": name,
                "amount_paise": amount_paise,
                "entry_type": entry_type,
                "date": date_str,
                "items_summary": items or "Kirana grocery goods",
                "confidence": 0.95,
            }
        return None

    def _parse_text_line(self, line: str) -> dict[str, Any] | None:
        """Parse a single text line into customer name, amount, items, and entry type."""
        line = self._normalize_digits(line)
        date_match = re.search(r"\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b", line)
        date_str = self._parse_ledger_date(date_match.group(0)) if date_match else Clock.today().isoformat()
        phone_match = re.search(r"(?:\+91|0)?[6-9]\d{9}\b", line)
        amount_source = line
        if date_match:
            amount_source = amount_source.replace(date_match.group(0), " ")
        if phone_match:
            amount_source = amount_source.replace(phone_match.group(0), " ")

        # Prefer currency-marked values, then use a bare number after dates/phones are removed.
        amt_match = re.search(
            r"(?:₹|रु\.?|rs\.?|inr)\s*([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)|"
            r"\b([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\b\s*(?:/-|रुपये)(?:\b|$)",
            amount_source,
            re.IGNORECASE,
        )
        if not amt_match:
            candidates = list(re.finditer(r"\b\d+(?:,\d{2,3})*(?:\.\d{1,2})?\b", amount_source))
            amt_match = candidates[-1] if candidates else None
        if not amt_match:
            return None

        amount_text = next((group for group in amt_match.groups() if group), None) or amt_match.group(0)
        amount_paise = self._amount_to_paise(amount_text)

        if amount_paise <= 0:
            return None

        # Check entry type
        is_payment = bool(re.search(r"(जमा|paid|received|diye|cash|रोकड़)", line, re.IGNORECASE))
        entry_type = "payment_received" if is_payment else "credit_given"

        # Check for phone
        phone_match = re.search(r"(?:\+91|0)?[6-9]\d{9}", line)
        customer_phone = phone_match.group(0) if phone_match else None

        # Clean line to isolate name and items
        cleaned = line
        if amt_match:
            cleaned = cleaned.replace(amt_match.group(0), " ")
        if date_match:
            cleaned = cleaned.replace(date_match.group(0), " ")
        if phone_match:
            cleaned = cleaned.replace(phone_match.group(0), " ")

        cleaned = re.sub(r"(जमा|paid|received|diye|cash|रोकड़|उधारी|बाकी|खाता|rs\.?|inr|₹)", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"[\(\)\[\]\{\}]", "", cleaned)

        parts = [p.strip(" -\u2013:,|") for p in re.split(r"[-\u2013:,|]", cleaned) if p.strip(" -\u2013:,|")]
        name = parts[0] if parts else "Customer"
        items = ", ".join(parts[1:]) if len(parts) > 1 else "Kirana grocery goods"

        return {
            "customer_name": name,
            "customer_phone": customer_phone,
            "amount_paise": amount_paise,
            "entry_type": entry_type,
            "date": date_str,
            "items_summary": items,
            "confidence": 0.94,
        }

    @staticmethod
    def _normalize_digits(value: str) -> str:
        """Convert common Indic numerals to ASCII for deterministic parsing."""
        digit_map = str.maketrans("०१२३४५६७८९", "0123456789")
        return value.translate(digit_map)

    @staticmethod
    def _amount_to_paise(value: str) -> int:
        try:
            return int(float(value.replace(",", "")) * 100)
        except ValueError:
            return 0

    @staticmethod
    def _parse_ledger_date(value: str) -> str:
        parts = [int(part) for part in re.split(r"[-/]", value)]
        if len(parts) != 3:
            return Clock.today().isoformat()
        day, month, year = parts
        if year < 100:
            year += 2000
        if day > 31:
            year, month, day = day, month, year
        try:
            return datetime.date(year, month, day).isoformat()
        except ValueError:
            return Clock.today().isoformat()


class MockOCRClient(BaseOCRClient):
    """Deterministic mock ledger digitizer producing typical Indian kirana khata rows."""

    def extract_khata_rows_sync(self) -> list[dict[str, Any]]:
        """Synchronous helper for fallback sample ledger rows."""
        today_date = Clock.today()
        d1 = (today_date - datetime.timedelta(days=2)).isoformat()
        d2 = (today_date - datetime.timedelta(days=1)).isoformat()
        d3 = today_date.isoformat()

        return [
            {
                "customer_name": "Sunita Patil",
                "customer_phone": "+919821000001",
                "amount_paise": 45000,
                "entry_type": "credit_given",
                "date": d1,
                "items_summary": "1kg Sabudana, 500ml Cow Ghee",
                "confidence": 0.96,
                "flags": [],
            },
            {
                "customer_name": "Anil Deshmukh",
                "customer_phone": "+919821000002",
                "amount_paise": 125000,
                "entry_type": "credit_given",
                "date": d2,
                "items_summary": "5kg Aashirvaad Atta, 2L Fortune Oil",
                "confidence": 0.91,
                "flags": [],
            },
            {
                "customer_name": "Meena Joshi",
                "customer_phone": "+919821000003",
                "amount_paise": 30000,
                "entry_type": "payment_received",
                "date": d3,
                "items_summary": "Cash received on account",
                "confidence": 0.88,
                "flags": [],
            },
        ]

    async def extract_khata_rows(
        self,
        image_bytes: bytes,
        filename: str = "ledger.jpg",
    ) -> list[dict[str, Any]]:
        return self.extract_khata_rows_sync()


def get_ocr_client(settings: Settings | None = None) -> BaseOCRClient:
    """Factory selecting the OCR client."""
    cfg = settings or get_settings()

    if cfg.ai_mode == "mock":
        return MockOCRClient()

    if cfg.sarvam_api_key and cfg.sarvam_doc_ai_enabled:
        return SarvamDocOCRClient(cfg)

    logger.warning("no_ocr_api_key_found_using_mock")
    return MockOCRClient()

