import io

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app
from app.services.crypto import decrypt_file, encrypt_file
from app.services.signed_url import generate_signed_url, verify_signed_url

TEST_DATABASE_URL = "sqlite:///./test_files.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    client.post("/auth/register", json={
        "username": "fileuser",
        "email": "file@example.com",
        "password": "filepass123",
    })
    resp = client.post("/auth/login", json={"username": "fileuser", "password": "filepass123"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.fixture
def uploaded_file(client, auth_headers):
    content = b"top secret data"
    resp = client.post(
        "/files/upload",
        files={"file": ("secret.txt", io.BytesIO(content), "text/plain")},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    return resp.json()


class TestFiles:
    def test_upload_file(self, client, auth_headers):
        content = b"hello world"
        resp = client.post(
            "/files/upload",
            files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["filename"] == "test.txt"
        assert data["size"] == len(content)

    def test_list_files(self, client, auth_headers, uploaded_file):
        resp = client.get("/files/", headers=auth_headers)
        assert resp.status_code == 200
        files = resp.json()
        assert len(files) == 1
        assert files[0]["filename"] == "secret.txt"

    def test_presign_and_download(self, client, auth_headers, uploaded_file):
        file_id = uploaded_file["file_id"]

        # get signed URL
        presign = client.get(f"/files/{file_id}/presign", headers=auth_headers)
        assert presign.status_code == 200
        url = presign.json()["url"]

        # extract token from URL and download
        token = url.split("/files/download/")[1]
        download = client.get(f"/files/download/{token}")
        assert download.status_code == 200
        assert download.content == b"top secret data"

    def test_download_invalid_token(self, client):
        resp = client.get("/files/download/invalidtoken")
        assert resp.status_code == 403

    def test_delete_file(self, client, auth_headers, uploaded_file):
        file_id = uploaded_file["file_id"]
        resp = client.delete(f"/files/{file_id}", headers=auth_headers)
        assert resp.status_code == 204

        # confirm gone
        files = client.get("/files/", headers=auth_headers).json()
        assert len(files) == 0

    def test_upload_unauthenticated(self, client):
        resp = client.post(
            "/files/upload",
            files={"file": ("test.txt", io.BytesIO(b"data"), "text/plain")},
        )
        assert resp.status_code == 403


class TestCrypto:
    def test_encrypt_decrypt_roundtrip(self):
        original = b"sensitive payload 12345"
        ciphertext, nonce = encrypt_file(original)
        assert ciphertext != original
        assert decrypt_file(ciphertext, nonce) == original

    def test_different_nonces_per_file(self):
        _, nonce1 = encrypt_file(b"data")
        _, nonce2 = encrypt_file(b"data")
        assert nonce1 != nonce2  # nonces must never repeat


class TestSignedUrl:
    def test_valid_token(self):
        url = generate_signed_url("file-123", "user-456")
        token = url.split("/files/download/")[1]
        result = verify_signed_url(token)
        assert result == ("file-123", "user-456")

    def test_tampered_token(self):
        assert verify_signed_url("totallyfaketoken") is None
