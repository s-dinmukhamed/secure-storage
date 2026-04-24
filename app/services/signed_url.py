from __future__ import annotations

import base64
import hashlib
import hmac
import os
import time

SIGNING_KEY = os.getenv("SIGNING_KEY", "signing-key-change-me").encode()


def generate_signed_url(file_id: str, user_id: str, expires_in: int = 300) -> str:
    """
    Generate a time-limited signed download URL.
    expires_in: seconds until expiry (default 5 min)
    """
    expires_at = int(time.time()) + expires_in
    message = f"{file_id}:{user_id}:{expires_at}".encode()
    signature = hmac.new(SIGNING_KEY, message, hashlib.sha256).hexdigest()
    token = base64.urlsafe_b64encode(f"{file_id}:{user_id}:{expires_at}:{signature}".encode()).decode()
    return f"/files/download/{token}"


def verify_signed_url(token: str) -> tuple[str, str] | None:
    """
    Verify signed URL token. Returns (file_id, user_id) or None if invalid/expired.
    """
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
        file_id, user_id, expires_at, signature = decoded.split(":")

        if int(time.time()) > int(expires_at):
            return None  # expired

        message = f"{file_id}:{user_id}:{expires_at}".encode()
        expected = hmac.new(SIGNING_KEY, message, hashlib.sha256).hexdigest()

        if not hmac.compare_digest(expected, signature):  # constant-time compare
            return None

        return file_id, user_id
    except Exception:
        return None
