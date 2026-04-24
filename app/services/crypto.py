from __future__ import annotations

import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# In production: load from KMS or secrets manager
MASTER_KEY = base64.b64decode(os.getenv("MASTER_KEY", base64.b64encode(os.urandom(32)).decode()))


def encrypt_file(data: bytes) -> tuple[bytes, bytes]:
    """
    Encrypt file bytes using AES-256-GCM.
    Returns (ciphertext_with_tag, nonce).
    Each file gets a unique random nonce — never reuse nonces with the same key.
    """
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    aesgcm = AESGCM(MASTER_KEY)
    ciphertext = aesgcm.encrypt(nonce, data, None)  # None = no AAD
    return ciphertext, nonce


def decrypt_file(ciphertext: bytes, nonce: bytes) -> bytes:
    """
    Decrypt AES-256-GCM ciphertext.
    GCM authentication tag is verified automatically — raises InvalidTag if tampered.
    """
    aesgcm = AESGCM(MASTER_KEY)
    return aesgcm.decrypt(nonce, ciphertext, None)
