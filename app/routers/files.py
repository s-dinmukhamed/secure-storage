from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.file import FileRecord, AuditLog
from app.services.crypto import encrypt_file, decrypt_file
from app.services.signed_url import generate_signed_url, verify_signed_url

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/upload", status_code=201)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = await file.read()

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    encrypted, nonce = encrypt_file(data)

    record = FileRecord(
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(data),
        encrypted_data=encrypted,
        nonce=nonce,
        owner_id=current_user.id,
    )
    db.add(record)

    log = AuditLog(
        user_id=current_user.id,
        action="UPLOAD",
        resource_id=record.id,
        ip_address=request.client.host,
        detail=file.filename,
    )
    db.add(log)
    db.commit()

    return {"file_id": record.id, "filename": record.filename, "size": record.size_bytes}


@router.get("/")
def list_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    files = db.query(FileRecord).filter(FileRecord.owner_id == current_user.id).all()
    return [
        {"id": f.id, "filename": f.filename, "size": f.size_bytes, "created_at": f.created_at}
        for f in files
    ]


@router.get("/{file_id}/presign")
def presign(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    if record.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    url = generate_signed_url(file_id, current_user.id)
    return {"url": url, "expires_in": 300}


@router.get("/download/{token}")
def download_via_token(token: str, request: Request, db: Session = Depends(get_db)):
    result = verify_signed_url(token)
    if not result:
        raise HTTPException(status_code=403, detail="Invalid or expired link")

    file_id, user_id = result
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    plaintext = decrypt_file(record.encrypted_data, record.nonce)

    log = AuditLog(
        user_id=user_id,
        action="DOWNLOAD",
        resource_id=file_id,
        ip_address=request.client.host,
    )
    db.add(log)
    db.commit()

    return Response(
        content=plaintext,
        media_type=record.content_type,
        headers={"Content-Disposition": f'attachment; filename="{record.filename}"'},
    )


@router.delete("/{file_id}", status_code=204)
def delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    if record.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(record)
    log = AuditLog(user_id=current_user.id, action="DELETE", resource_id=file_id)
    db.add(log)
    db.commit()
