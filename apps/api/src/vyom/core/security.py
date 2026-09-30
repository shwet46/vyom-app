"""Security utilities: JWT generation, validation, and OTP hashing."""

from __future__ import annotations

import datetime
import hashlib
from typing import Any

import jwt

from vyom.config import get_settings


def create_access_token(data: dict[str, Any], expires_delta: datetime.timedelta | None = None) -> str:
    """Create a signed JWT access token."""
    settings = get_settings()
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.datetime.now(datetime.UTC) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=settings.jwt_expire_minutes)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT access token."""
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def hash_otp(phone_e164: str, code: str) -> str:
    """Hash an OTP combined with the phone number."""
    settings = get_settings()
    salt = settings.jwt_secret[:16]
    return hashlib.sha256(f"{phone_e164}:{code}:{salt}".encode()).hexdigest()
