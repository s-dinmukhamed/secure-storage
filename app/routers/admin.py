from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.file import AuditLog
from app.models.user import User

router = APIRouter()


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "resource_id": log.resource_id,
            "ip_address": log.ip_address,
            "detail": log.detail,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "role": u.role} for u in users]
