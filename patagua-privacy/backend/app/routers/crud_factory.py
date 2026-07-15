from typing import Any, Type

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db


def create_crud_router(
    *,
    model: Type[Any],
    create_schema: Type[BaseModel],
    update_schema: Type[BaseModel],
    read_schema: Type[BaseModel],
    prefix: str,
    tag: str,
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    @router.get("", response_model=list[read_schema])  # type: ignore[valid-type]
    def list_records(
        organization_id: str = Query(default=settings.default_organization_id, min_length=1),
        db: Session = Depends(get_db),
    ) -> list[Any]:
        return db.query(model).filter(model.organization_id == organization_id).order_by(model.id.desc()).all()

    @router.get("/{record_id}", response_model=read_schema)  # type: ignore[valid-type]
    def get_record(
        record_id: int,
        organization_id: str = Query(default=settings.default_organization_id, min_length=1),
        db: Session = Depends(get_db),
    ) -> Any:
        record = db.query(model).filter(model.id == record_id, model.organization_id == organization_id).first()
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{tag} no encontrado")
        return record

    @router.post("", response_model=read_schema, status_code=status.HTTP_201_CREATED)  # type: ignore[valid-type]
    def create_record(
        payload: create_schema,  # type: ignore[valid-type]
        organization_id: str = Query(default=settings.default_organization_id, min_length=1),
        db: Session = Depends(get_db),
    ) -> Any:
        record = model(**payload.model_dump(), organization_id=organization_id)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @router.put("/{record_id}", response_model=read_schema)  # type: ignore[valid-type]
    def update_record(
        record_id: int,
        payload: update_schema,  # type: ignore[valid-type]
        organization_id: str = Query(default=settings.default_organization_id, min_length=1),
        db: Session = Depends(get_db),
    ) -> Any:
        record = db.query(model).filter(model.id == record_id, model.organization_id == organization_id).first()
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{tag} no encontrado")

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(record, field, value)

        db.commit()
        db.refresh(record)
        return record

    @router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_record(
        record_id: int,
        organization_id: str = Query(default=settings.default_organization_id, min_length=1),
        db: Session = Depends(get_db),
    ) -> None:
        record = db.query(model).filter(model.id == record_id, model.organization_id == organization_id).first()
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{tag} no encontrado")
        db.delete(record)
        db.commit()

    return router
