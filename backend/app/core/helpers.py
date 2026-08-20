import io
import json
from datetime import date, datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import ALGORITHM
from app.models.domain import LogAuditoria, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Annotated[Session, Depends(get_db)]) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la sesión",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.query(User).filter(User.email == email, User.is_active.is_(True)).first()
    if user is None:
        raise credentials_exception
    return user


def require_roles(*allowed_roles: str):
    def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in allowed_roles and current_user.role != "Administrador":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso denegado. Se requiere uno de los siguientes roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


def log_action(db: Session, user_id: int | None, action: str, entity: str, details: dict):
    log_entry = LogAuditoria(
        usuario_id=user_id,
        accion=action,
        entidad_afectada=entity,
        fecha_hora=datetime.now(),
        detalle_json=details
    )
    db.add(log_entry)
    db.commit()


def add_business_days(start_date: date, num_days: int) -> date:
    """Adds business days (Monday-Friday) to a given start date."""
    current = start_date
    added = 0
    while added < num_days:
        current += timedelta(days=1)
        if current.weekday() < 5:  # 0=Monday, ..., 4=Friday
            added += 1
    return current


def calculate_business_days_remaining(target_date: date) -> int:
    """Calculates business days remaining between today and target_date (negative if expired)."""
    today = date.today()
    if today >= target_date:
        # Count negative business days
        current = target_date
        count = 0
        while current < today:
            current += timedelta(days=1)
            if current.weekday() < 5:
                count -= 1
        return count
    else:
        current = today
        count = 0
        while current < target_date:
            current += timedelta(days=1)
            if current.weekday() < 5:
                count += 1
        return count
