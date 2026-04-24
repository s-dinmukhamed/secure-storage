import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum("admin", "owner", "viewer", name="user_role"), default="owner")
    created_at = Column(DateTime, default=datetime.utcnow)

    files = relationship("FileRecord", back_populates="owner")
    audit_logs = relationship("AuditLog", back_populates="user")
