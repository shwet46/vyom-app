"""i18n API: server-side UI translation bundles and on-demand short text translation with caching."""

from __future__ import annotations

import hashlib
from typing import Any

from fastapi import APIRouter, Query
from pydantic import BaseModel

from vyom.core.deps import DatabaseDep
from vyom.models.platform import TranslationCache

router = APIRouter(prefix="/i18n", tags=["i18n"])

# Base English source bundle
DEFAULT_EN_BUNDLE: dict[str, str] = {
    "nav.home": "Home",
    "nav.approvals": "Approvals",
    "nav.festivals": "Festivals",
    "nav.udhaar": "Udhaar",
    "nav.settings": "Settings",
    "home.today_sales": "Today's Sales",
    "home.pending_approvals": "Pending Approvals",
    "home.active_udhaar": "Active Udhaar",
    "home.recovered": "Recovered This Month",
    "button.approve": "Approve",
    "button.reject": "Reject",
    "button.snooze": "Snooze",
    "button.remind": "Remind Customer",
    "button.view_details": "View Details",
}

# Pre-curated Hindi bundle
DEFAULT_HI_BUNDLE: dict[str, str] = {
    "nav.home": "होम",
    "nav.approvals": "मंजूरी",
    "nav.festivals": "त्यौहार",
    "nav.udhaar": "उधार बहीखाता",
    "nav.settings": "सेटिंग्स",
    "home.today_sales": "आज की बिक्री",
    "home.pending_approvals": "लंबित प्रस्ताव",
    "home.active_udhaar": "बकाया उधार",
    "home.recovered": "इस महीने वसूली",
    "button.approve": "मंजूर करें",
    "button.reject": "अस्वीकार करें",
    "button.snooze": "बाद में देखें",
    "button.remind": "याद-दहानी भेजें",
    "button.view_details": "विवरण देखें",
}

# Pre-curated Marathi bundle
DEFAULT_MR_BUNDLE: dict[str, str] = {
    "nav.home": "मुख्यपृष्ठ",
    "nav.approvals": "मंजुरी",
    "nav.festivals": "सण व उत्सव",
    "nav.udhaar": "उधारी खाते",
    "nav.settings": "सेटिंग्ज",
    "home.today_sales": "आजची विक्री",
    "home.pending_approvals": "प्रलंबित प्रस्ताव",
    "home.active_udhaar": "एकूण उधारी",
    "home.recovered": "या महिन्यातील वसुली",
    "button.approve": "मंजूर करा",
    "button.reject": "नाकारा",
    "button.snooze": "नंतर बघा",
    "button.remind": "आठवण पाठवा",
    "button.view_details": "तपशील बघा",
}

# Hand-authored Hinglish bundle
DEFAULT_HINGLISH_BUNDLE: dict[str, str] = {
    "nav.home": "Home",
    "nav.approvals": "Approvals",
    "nav.festivals": "Festivals",
    "nav.udhaar": "Udhaar",
    "nav.settings": "Settings",
    "home.today_sales": "Aaj ki Bikri",
    "home.pending_approvals": "Pending Approvals",
    "home.active_udhaar": "Market Udhaar",
    "home.recovered": "Iss Mahine Vasooli",
    "button.approve": "Approve Karein",
    "button.reject": "Reject Karein",
    "button.snooze": "Baad Mein",
    "button.remind": "Reminder Bhejo",
    "button.view_details": "Details Dekho",
}


class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "hi"


@router.get("/bundle")
async def get_translation_bundle(
    db: DatabaseDep,
    lang: str = Query("hinglish"),
) -> dict[str, Any]:
    """Retrieve UI string dictionary for a specific language (en, hi, mr, hinglish)."""
    lang_clean = lang.lower()

    if lang_clean == "hi":
        bundle = DEFAULT_HI_BUNDLE
    elif lang_clean == "mr":
        bundle = DEFAULT_MR_BUNDLE
    elif lang_clean == "hinglish":
        bundle = DEFAULT_HINGLISH_BUNDLE
    else:
        bundle = DEFAULT_EN_BUNDLE

    return {
        "lang": lang_clean,
        "bundle": bundle,
        "etag": hashlib.md5(f"{lang_clean}_{len(bundle)}".encode()).hexdigest(),
    }


@router.post("/translate")
async def translate_text(
    payload: TranslateRequest,
    db: DatabaseDep,
) -> dict[str, str]:
    """Translate short text with MongoDB caching."""
    cache_key = hashlib.sha256(f"{payload.text}:{payload.target_lang}".encode()).hexdigest()

    cached = await db.translation_cache.find_one({"cache_key": cache_key})
    if cached:
        return {"translated_text": cached["translated_text"], "cached": "true"}

    # Mock / Fallback translation
    translated = f"[{payload.target_lang.upper()}] {payload.text}"
    entry = TranslationCache(
        cache_key=cache_key,
        source_text=payload.text,
        target_lang=payload.target_lang,
        translated_text=translated,
    )
    await db.translation_cache.insert_one(entry.to_mongo())

    return {"translated_text": translated, "cached": "false"}
