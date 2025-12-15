from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class UserRole(str, Enum):
    DRIVER = "DRIVER"
    COMPANY = "COMPANY"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    password_hash: str
    role: UserRole
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(SQLModel):
    name: str
    email: str
    password: str
    role: UserRole

class UserPublic(SQLModel):
    id: int
    name: str
    email: str
    role: UserRole
