from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action, require_roles
from app.core.security import get_password_hash
from app.models.domain import User
from app.schemas.domain import UserCreate, UserRead

router = APIRouter(tags=["Usuarios y Funcionarios"])


@router.get("/users", response_model=list[UserRead])
def get_users(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(User).order_by(User.id.asc()).all()


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    current_user: Annotated[User, Depends(require_roles("Encargado/a Responsable", "Jefe de Servicio", "Administrador"))],
    db: Annotated[Session, Depends(get_db)]
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
    
    password = payload.password if payload.password else "admin123"
    db_user = User(
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        hashed_password=get_password_hash(password),
        area_id=payload.area_id,
        rut=payload.rut,
        cargo=payload.cargo
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    log_action(db, current_user.id, "Registrar Funcionario", "User", {"id": db_user.id, "email": db_user.email, "role": db_user.role})
    return db_user


@router.put("/users/{id}", response_model=UserRead)
def update_user(
    id: int,
    payload: UserCreate,
    current_user: Annotated[User, Depends(require_roles("Encargado/a Responsable", "Jefe de Servicio", "Administrador"))],
    db: Annotated[Session, Depends(get_db)]
):
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    db_user.email = payload.email
    db_user.full_name = payload.full_name
    db_user.role = payload.role
    db_user.area_id = payload.area_id
    db_user.rut = payload.rut
    db_user.cargo = payload.cargo
    
    if payload.password:
        db_user.hashed_password = get_password_hash(payload.password)
        
    db.commit()
    db.refresh(db_user)
    log_action(db, current_user.id, "Actualizar Funcionario", "User", {"id": db_user.id, "email": db_user.email})
    return db_user


@router.delete("/users/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    id: int,
    current_user: Annotated[User, Depends(require_roles("Encargado/a Responsable", "Jefe de Servicio", "Administrador"))],
    db: Annotated[Session, Depends(get_db)]
):
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")
        
    log_action(db, current_user.id, "Eliminar Funcionario", "User", {"id": db_user.id, "email": db_user.email})
    db.delete(db_user)
    db.commit()
    return None
