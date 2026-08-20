from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.core.security import create_access_token, verify_password
from app.models.domain import User
from app.schemas.domain import LoginRequest, Token, UserRead

router = APIRouter(tags=["Autenticación"])


@router.post("/auth/login", response_model=Token)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> Token:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    log_action(db, user.id, "Inicio de Sesión", "User", {"email": user.email, "role": user.role})
    return Token(access_token=create_access_token(user.email), user=UserRead.model_validate(user))


@router.post("/auth/claveunica", response_model=Token)
def login_claveunica(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> Token:
    user = db.query(User).filter(User.email == payload.email, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no registrado en el sistema")
    
    log_action(db, user.id, "Inicio de Sesión (ClaveÚnica)", "User", {"email": user.email, "role": user.role})
    return Token(access_token=create_access_token(user.email), user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user
