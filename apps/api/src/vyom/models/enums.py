"""All domain enums used across VYOM collections and services."""

from __future__ import annotations

from enum import StrEnum


class Language(StrEnum):
    EN = "en"
    HI = "hi"
    MR = "mr"
    HINGLISH = "hinglish"


class OnboardingState(StrEnum):
    PENDING = "pending"
    COMPLETED = "completed"


class CatalogItemSource(StrEnum):
    SEED = "seed"
    INFERRED = "inferred"
    MANUAL = "manual"


class PaymentMode(StrEnum):
    UPI = "upi"
    CASH = "cash"
    KHATA = "khata"


class TransactionSource(StrEnum):
    PAYTM_SIM = "paytm_sim"
    KHATA = "khata"
    MANUAL = "manual"


class KhataStatus(StrEnum):
    OPEN = "open"
    PROMISED = "promised"
    PAID = "paid"
    DISPUTED = "disputed"
    CLAIMED_PAID = "claimed_paid"


class KhataEntrySource(StrEnum):
    MANUAL = "manual"
    OCR = "ocr"
    VOICE = "voice"


class KhataScanStatus(StrEnum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    REVIEW = "review"
    CONFIRMED = "confirmed"
    FAILED = "failed"


class ScanCreatedVia(StrEnum):
    CAMERA = "camera"
    UPLOAD = "upload"


class EntryType(StrEnum):
    CREDIT_GIVEN = "credit_given"
    PAYMENT_RECEIVED = "payment_received"


class RowFlag(StrEnum):
    NUMERAL_AMBIGUITY = "numeral_ambiguity"
    DUPLICATE = "duplicate"
    UNKNOWN_CUSTOMER = "unknown_customer"
    TOTAL_MISMATCH = "total_mismatch"


class FestivalRegionScope(StrEnum):
    PAN_INDIA = "pan_india"
    MAHARASHTRA = "maharashtra"
    NORTH = "north"
    GUJARAT = "gujarat"
    SOUTH = "south"
    BENGAL = "bengal"


class DateConfidence(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ToneProfile(StrEnum):
    FESTIVE = "festive"
    SOLEMN = "solemn"
    OBSERVANT = "observant"


class RitualRole(StrEnum):
    FASTING_FOOD = "fasting_food"
    PUJA_ITEM = "puja_item"
    DECOR = "decor"
    SWEET_INGREDIENT = "sweet_ingredient"
    GIFTING = "gifting"
    HOSPITALITY = "hospitality"
    STAPLE = "staple"


class PlaybookReviewStatus(StrEnum):
    DRAFT = "draft"
    REVIEWED = "reviewed"


class KitRequestStatus(StrEnum):
    REQUESTED = "requested"
    ACKNOWLEDGED = "acknowledged"
    READY = "ready"
    PICKED_UP = "picked_up"
    CANCELLED = "cancelled"


class OpportunityKind(StrEnum):
    CAMPAIGN = "campaign"
    ADVISORY = "advisory"


class OpportunityType(StrEnum):
    WINBACK = "winback"
    DEAD_HOUR = "dead_hour"
    FALLING_SALES = "falling_sales"
    FESTIVAL_KIT = "festival_kit"
    FESTIVAL_GREETING = "festival_greeting"
    FESTIVAL_STOCKUP = "festival_stockup"
    POST_FESTIVAL_CLEARANCE = "post_festival_clearance"


class OpportunityStatus(StrEnum):
    DETECTED = "detected"
    PROPOSED = "proposed"
    APPROVED = "approved"
    REJECTED = "rejected"
    SNOOZED = "snoozed"
    EXPIRED = "expired"
    ACKNOWLEDGED = "acknowledged"


class OfferType(StrEnum):
    DISCOUNT = "discount"
    COMBO = "combo"
    FREEBIE = "freebie"
    KIT = "kit"
    NONE = "none"


class CampaignStatus(StrEnum):
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class DeliveryGroup(StrEnum):
    TREATED = "treated"
    HOLDOUT = "holdout"


class DeliveryStatus(StrEnum):
    QUEUED = "queued"
    SENT = "sent"
    FAILED = "failed"
    BLOCKED_BY_CAP = "blocked_by_cap"
    BLOCKED_QUIET_HOURS = "blocked_quiet_hours"
    BLOCKED_NO_CONSENT = "blocked_no_consent"
    BLOCKED_TONE_RULE = "blocked_tone_rule"


class CouponStatus(StrEnum):
    ISSUED = "issued"
    REDEEMED = "redeemed"
    EXPIRED = "expired"


class PaymentPurpose(StrEnum):
    UDHAAR = "udhaar"
    COUPON_PURCHASE = "coupon_purchase"
    KIT = "kit"


class PaymentStatus(StrEnum):
    CREATED = "created"
    PAID = "paid"
    EXPIRED = "expired"


class AuditActor(StrEnum):
    AI = "ai"
    MERCHANT = "merchant"
    CUSTOMER = "customer"
    SYSTEM = "system"


class MemoryKind(StrEnum):
    PREFERENCE = "preference"
    OUTCOME = "outcome"


class BotMessageDirection(StrEnum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class BotMessageKind(StrEnum):
    TEXT = "text"
    VOICE = "voice"
    CALLBACK = "callback"
    PHOTO = "photo"


class CopilotRole(StrEnum):
    MERCHANT = "merchant"
    COPILOT = "copilot"


class CopilotMessageKind(StrEnum):
    VOICE = "voice"
    TEXT = "text"


class ActionStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class GuardrailStatus(StrEnum):
    PASSED = "passed"
    VIOLATED = "violated"
    ADJUSTED = "adjusted"


class FestivalPhase(StrEnum):
    PREP = "prep"
    ACTIVE = "active"
    PEAK = "peak"
    POST = "post"
    UPCOMING = "upcoming"
    NONE = "none"
