from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from .auth import hash_password, verify_password, create_access_token, decode_token
from .db import create_db_and_tables, get_session
from .models import (
    User, UserCreate, UserPublic, UserRole,
    Trip, TripCreate, TripPublic, TripStatus,
    Reservation, TripDetailPublic
)

app = FastAPI(title="Transport Match API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # lås senare till din frontend domän
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/auth/signup")
def signup(payload: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email finns redan")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer", "user": UserPublic(**user.model_dump())}


@app.post("/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == form.username)).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Fel email eller lösenord")

    token = create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer"}


def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
    try:
        user_id = int(decode_token(token))
    except Exception:
        raise HTTPException(status_code=401, detail="Ogiltig token")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Användare hittades inte")

    return user


@app.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)):
    return UserPublic(**user.model_dump())


@app.post("/trips", response_model=TripPublic)
def create_trip(
    payload: TripCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user.role != UserRole.COMPANY:
        raise HTTPException(status_code=403, detail="Endast företag kan skapa körningar")

    trip = Trip(
        company_id=user.id,
        origin=payload.origin,
        destination=payload.destination,
        date=payload.date,
        time_window=payload.time_window,
        compensation_sek=payload.compensation_sek,
        vehicle_info=payload.vehicle_info,
    )
    session.add(trip)
    session.commit()
    session.refresh(trip)
    return TripPublic(**trip.model_dump())


@app.get("/trips", response_model=List[TripPublic])
def list_open_trips(session: Session = Depends(get_session)):
    trips = session.exec(select(Trip).where(Trip.status == TripStatus.OPEN)).all()
    return [TripPublic(**t.model_dump()) for t in trips]


@app.post("/trips/{trip_id}/reserve")
def reserve_trip(
    trip_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Endast drivers kan paxa körningar")

    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip finns inte")

    if trip.status != TripStatus.OPEN:
        raise HTTPException(status_code=400, detail="Trip är inte ledig")

    try:
        res = Reservation(trip_id=trip_id, driver_id=user.id)
        session.add(res)

        trip.status = TripStatus.RESERVED
        session.add(trip)

        session.commit()
        return {"ok": True, "trip_id": trip_id, "driver_id": user.id}
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=400, detail="Trip är redan paxad")
    

@app.get("/trips/mine", response_model=List[TripPublic])
def my_trips(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user.role == UserRole.COMPANY:
        trips = session.exec(
            select(Trip).where(Trip.company_id == user.id).order_by(Trip.id.desc())
        ).all()
    else:
        trips = session.exec(
            select(Trip)
            .join(Reservation, Reservation.trip_id == Trip.id)
            .where(Reservation.driver_id == user.id)
            .order_by(Trip.id.desc())
        ).all()

    return [TripPublic(**t.model_dump()) for t in trips]


@app.get("/trips/{trip_id}", response_model=TripDetailPublic)
def get_trip(
    trip_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip finns inte")

    reserved_driver = None
    if trip.status == TripStatus.RESERVED:
        res = session.exec(select(Reservation).where(Reservation.trip_id == trip_id)).first()

        # Bara företaget som äger trippen får se vem som paxat
        if res and user.role == UserRole.COMPANY and trip.company_id == user.id:
            driver = session.get(User, res.driver_id)
            if driver:
                reserved_driver = UserPublic(**driver.model_dump())

    return TripDetailPublic(
        trip=TripPublic(**trip.model_dump()),
        reserved_driver=reserved_driver,
    )


@app.delete("/trips/{trip_id}/reserve")
def unreserve_trip(
    trip_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Endast drivers kan avboka")

    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip finns inte")

    if trip.status != TripStatus.RESERVED:
        raise HTTPException(status_code=400, detail="Trip är inte paxad")

    res = session.exec(select(Reservation).where(Reservation.trip_id == trip_id)).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation saknas")

    if res.driver_id != user.id:
        raise HTTPException(status_code=403, detail="Du har inte paxat denna trip")

    session.delete(res)
    trip.status = TripStatus.OPEN
    session.add(trip)
    session.commit()

    return {"ok": True, "trip_id": trip_id}


@app.post("/trips/{trip_id}/complete")
def complete_trip(
    trip_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user.role != UserRole.COMPANY:
        raise HTTPException(status_code=403, detail="Endast företag kan markera completed")

    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip finns inte")

    if trip.company_id != user.id:
        raise HTTPException(status_code=403, detail="Inte din trip")

    if trip.status != TripStatus.RESERVED:
        raise HTTPException(status_code=400, detail="Trip måste vara RESERVED för att slutföras")

    trip.status = TripStatus.COMPLETED
    session.add(trip)
    session.commit()
    return {"ok": True, "trip_id": trip_id, "status": trip.status}


@app.post("/trips/{trip_id}/cancel")
def cancel_trip(
    trip_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user.role != UserRole.COMPANY:
        raise HTTPException(status_code=403, detail="Endast företag kan avboka")

    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip finns inte")

    if trip.company_id != user.id:
        raise HTTPException(status_code=403, detail="Inte din trip")

    if trip.status not in (TripStatus.OPEN, TripStatus.RESERVED):
        raise HTTPException(status_code=400, detail="Trip kan inte avbokas i nuvarande status")

    # om den var paxad: ta bort reservationen
    res = session.exec(select(Reservation).where(Reservation.trip_id == trip_id)).first()
    if res:
        session.delete(res)

    trip.status = TripStatus.CANCELLED
    session.add(trip)
    session.commit()
    return {"ok": True, "trip_id": trip_id, "status": trip.status}