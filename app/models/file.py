import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, LargeBinary, Integer, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class FileRecord(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    encrypted_data = Column(LargeBinary, nullable=False)
    nonce = Column(LargeBinary, nullable=False)  # AES-GCM nonce, stored per-file
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="files")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)   # UPLOAD, DOWNLOAD, DELETE, LOGIN
    resource_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
