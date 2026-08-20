from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import Area, User
from app.schemas.domain import AreaCreate, AreaRead

router = APIRouter(tags=["Áreas y Divisiones"])


@router.get("/areas", response_model=list[AreaRead])
def get_areas(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(Area).order_by(Area.id.asc()).all()


@router.post("/areas", response_model=AreaRead, status_code=status.HTTP_201_CREATED)
def create_area(
    payload: AreaCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    area = Area(**payload.model_dump())
    db.add(area)
    db.commit()
    db.refresh(area)
    log_action(db, current_user.id, "Crear Área", "Area", {"id": area.id, "nombre": area.nombre})
    return area


@router.put("/areas/{id}", response_model=AreaRead)
def update_area(
    id: int,
    payload: AreaCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    area = db.query(Area).filter(Area.id == id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Área no encontrada")
    
    area.nombre = payload.nombre
    area.descripcion = payload.descripcion
    area.responsable_id = payload.responsable_id
    
    db.commit()
    db.refresh(area)
    log_action(db, current_user.id, "Actualizar Área", "Area", {"id": area.id, "nombre": area.nombre})
    return area
