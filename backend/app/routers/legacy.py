from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import CaseTicket, Consent, Finding, TreatmentActivity, User
from app.schemas.domain import (
    ActivityCreate,
    ActivityRead,
    ConsentCreate,
    ConsentRead,
    FindingCreate,
    FindingRead,
    TicketCreate,
    TicketRead,
)

router = APIRouter(tags=["Compatibilidad MVP"])


@router.get("/activities", response_model=list[ActivityRead])
def get_activities(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(TreatmentActivity).order_by(TreatmentActivity.id.asc()).all()


@router.post("/activities", response_model=ActivityRead, status_code=status.HTTP_201_CREATED)
def create_activity(payload: ActivityCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    act = TreatmentActivity(**payload.model_dump())
    db.add(act)
    db.commit()
    db.refresh(act)
    log_action(db, current_user.id, "Crear Actividad MVP", "TreatmentActivity", {"id": act.id, "nombre": act.name})
    return act


@router.put("/activities/{id}", response_model=ActivityRead)
def update_activity(id: int, payload: ActivityCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    act = db.query(TreatmentActivity).filter(TreatmentActivity.id == id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    for key, value in payload.model_dump().items():
        setattr(act, key, value)
    db.commit()
    db.refresh(act)
    log_action(db, current_user.id, "Editar Actividad MVP", "TreatmentActivity", {"id": id})
    return act


@router.delete("/activities/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    act = db.query(TreatmentActivity).filter(TreatmentActivity.id == id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    log_action(db, current_user.id, "Eliminar Actividad MVP", "TreatmentActivity", {"id": id, "nombre": act.name})
    db.delete(act)
    db.commit()
    return None


@router.get("/findings", response_model=list[FindingRead])
def get_findings(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(Finding).order_by(Finding.id.asc()).all()


@router.post("/findings", response_model=FindingRead, status_code=status.HTTP_201_CREATED)
def create_finding(payload: FindingCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    f = Finding(**payload.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    log_action(db, current_user.id, "Crear Hallazgo MVP", "Finding", {"id": f.id, "titulo": f.title})
    return f


@router.put("/findings/{id}", response_model=FindingRead)
def update_finding(id: int, payload: FindingCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    f = db.query(Finding).filter(Finding.id == id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Hallazgo no encontrado")
    for key, value in payload.model_dump().items():
        setattr(f, key, value)
    db.commit()
    db.refresh(f)
    log_action(db, current_user.id, "Editar Hallazgo MVP", "Finding", {"id": id})
    return f


@router.delete("/findings/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_finding(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    f = db.query(Finding).filter(Finding.id == id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Hallazgo no encontrado")
    log_action(db, current_user.id, "Eliminar Hallazgo MVP", "Finding", {"id": id})
    db.delete(f)
    db.commit()
    return None


@router.get("/consents", response_model=list[ConsentRead])
def get_consents(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(Consent).order_by(Consent.id.asc()).all()


@router.post("/consents", response_model=ConsentRead, status_code=status.HTTP_201_CREATED)
def create_consent(payload: ConsentCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    c = Consent(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    log_action(db, current_user.id, "Crear Consentimiento MVP", "Consent", {"id": c.id})
    return c


@router.put("/consents/{id}", response_model=ConsentRead)
def update_consent(id: int, payload: ConsentCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    c = db.query(Consent).filter(Consent.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")
    for key, value in payload.model_dump().items():
        setattr(c, key, value)
    db.commit()
    db.refresh(c)
    log_action(db, current_user.id, "Editar Consentimiento MVP", "Consent", {"id": id})
    return c


@router.delete("/consents/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_consent(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    c = db.query(Consent).filter(Consent.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")
    log_action(db, current_user.id, "Eliminar Consentimiento MVP", "Consent", {"id": id})
    db.delete(c)
    db.commit()
    return None


@router.get("/tickets", response_model=list[TicketRead])
def get_tickets(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(CaseTicket).order_by(CaseTicket.id.asc()).all()


@router.post("/tickets", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_ticket(payload: TicketCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    t = CaseTicket(**payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    log_action(db, current_user.id, "Crear Ticket MVP", "CaseTicket", {"id": t.id})
    return t


@router.put("/tickets/{id}", response_model=TicketRead)
def update_ticket(id: int, payload: TicketCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    t = db.query(CaseTicket).filter(CaseTicket.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    for key, value in payload.model_dump().items():
        setattr(t, key, value)
    db.commit()
    db.refresh(t)
    log_action(db, current_user.id, "Editar Ticket MVP", "CaseTicket", {"id": id})
    return t


@router.delete("/tickets/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    t = db.query(CaseTicket).filter(CaseTicket.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    log_action(db, current_user.id, "Eliminar Ticket MVP", "CaseTicket", {"id": id})
    db.delete(t)
    db.commit()
    return None
