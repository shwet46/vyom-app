"""Standard error envelope and exception hierarchy for VYOM API."""

from __future__ import annotations

from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base application exception."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Any = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found", details: Any = None) -> None:
        super().__init__(code="NOT_FOUND", message=message, status_code=404, details=details)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Unauthorized", details: Any = None) -> None:
        super().__init__(code="UNAUTHORIZED", message=message, status_code=401, details=details)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Forbidden", details: Any = None) -> None:
        super().__init__(code="FORBIDDEN", message=message, status_code=403, details=details)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflict", details: Any = None) -> None:
        super().__init__(code="CONFLICT", message=message, status_code=409, details=details)


class RateLimitError(AppError):
    def __init__(self, message: str = "Too many requests", details: Any = None) -> None:
        super().__init__(code="RATE_LIMITED", message=message, status_code=429, details=details)


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


async def general_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred.",
                "details": {"error": str(exc)},
            }
        },
    )
