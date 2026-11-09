import hashlib
import hmac
import os

from fastapi import HTTPException, Request

COOKIE_NAME = "ff_admin"


def admin_token() -> str:
    pin = os.environ.get("ADMIN_PIN", "")
    return hmac.new(pin.encode(), b"faunaflag-admin-session", hashlib.sha256).hexdigest()


def pin_ok(pin: str) -> bool:
    expected = os.environ.get("ADMIN_PIN", "")
    return bool(expected) and hmac.compare_digest(pin, expected)


def is_admin(request: Request) -> bool:
    token = request.cookies.get(COOKIE_NAME, "")
    return bool(token) and hmac.compare_digest(token, admin_token())


async def require_admin(request: Request) -> None:
    if not is_admin(request):
        raise HTTPException(status_code=401, detail="Admin PIN required")
