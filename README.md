# Secure File Vault API

![CI](https://github.com/YOUR_USERNAME/secure-vault/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/YOUR_USERNAME/secure-vault/actions/workflows/cd.yml/badge.svg)

REST API for encrypted file storage with authentication, RBAC, audit logging, and full CI/CD pipeline.

## Features

- **AES-256-GCM encryption** — every file encrypted at rest with a unique nonce
- **JWT auth** — short-lived access tokens (15 min) + refresh tokens (7 days)
- **RBAC** — roles: `admin`, `owner`, `viewer`
- **Presigned URLs** — HMAC-SHA256 time-limited download links (5 min TTL)
- **Audit log** — every upload/download/delete/login recorded with IP and timestamp

## Stack

FastAPI + SQLAlchemy + PostgreSQL + PyCA cryptography + Docker + GitHub Actions + Trivy

## Quick Start

```bash
docker-compose up --build
# → http://localhost:8000/docs
```

## CI/CD Pipeline

### CI (every push / PR)
1. **Lint** — `ruff check`
2. **Tests** — `pytest` with real Postgres service container
3. **Coverage** — uploaded to Codecov

### CD (merge to main)
1. **Build** Docker image (layer cache via GHA cache)
2. **Push** to Docker Hub — tags: `latest`, `sha-<commit>`, semver on releases
3. **Trivy scan** — fails on CRITICAL/HIGH CVEs
4. **SARIF** report → GitHub Security tab

### Required Secrets

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

Set in: `Settings → Secrets and variables → Actions`

## Running Tests Locally

```bash
pip install -r requirements.txt pytest pytest-cov httpx
pytest tests/ -v --cov=app
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | — | Register |
| POST | /auth/login | — | Login → tokens |
| POST | /auth/refresh | — | Refresh access token |
| GET | /auth/me | ✓ | Current user |
| POST | /files/upload | ✓ | Upload & encrypt |
| GET | /files/ | ✓ | List files |
| GET | /files/{id}/presign | ✓ | Signed download URL |
| GET | /files/download/{token} | — | Download via token |
| DELETE | /files/{id} | ✓ | Delete file |
| GET | /admin/audit-logs | admin | Audit log |
| GET | /admin/users | admin | List users |
