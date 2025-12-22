import os
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext

# Byt från bcrypt -> pbkdf2_sha256 (stabilt på Render, ingen 72-byte issue)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

ALGORITHM = "HS256"
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 dagar


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    sub = payload.get("sub")
    if not sub:
        raise JWTError("Missing subject")
    return sub