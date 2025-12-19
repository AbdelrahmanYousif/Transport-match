import datetime as dt
from datetime import datetime
from enum import Enum
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


# -------------------------
# Trips
# -------------------------

class TripStatus(str, Enum):
    OPEN = "OPEN"
    RESERVED = "RESERVED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Trip(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="user.id", index=True)

    origin: str
    destination: str

    date: Optional[dt.date] = Field(default=None)
    time_window: Optional[str] = Field(default=None)

    compensation_sek: int = Field(default=0)
    vehicle_info: Optional[str] = Field(default=None)

    status: TripStatus = Field(default=TripStatus.OPEN)


class TripCreate(SQLModel):
    origin: str
    destination: str
    date: Optional[dt.date] = None
    time_window: Optional[str] = None
    compensation_sek: int = 0
    vehicle_info: Optional[str] = None


class TripPublic(SQLModel):
    id: int
    origin: str
    destination: str
    date: Optional[dt.date] = None
    time_window: Optional[str] = None
    compensation_sek: int
    vehicle_info: Optional[str] = None
    status: TripStatus
