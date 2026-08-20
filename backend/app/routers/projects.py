from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import Fase, ImplementationProject, Tarea, User
from app.schemas.domain import ProjectRead, TareaCreate, TareaRead

router = APIRouter(tags=["Proyectos y Tareas"])


@router.get("/projects", response_model=list[ProjectRead])
def get_projects(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> list[ImplementationProject]:
    return db.query(ImplementationProject).order_by(ImplementationProject.updated_at.desc()).all()


@router.get("/projects/{project_id}/fases")
def get_project_fases(project_id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    fases = db.query(Fase).filter(Fase.proyecto_id == project_id).order_by(Fase.orden.asc()).all()
    res = []
    for f in fases:
        tareas_list = []
        for t in f.tareas:
            tareas_list.append({
                "id": t.id,
                "nombre": t.nombre,
                "descripcion": t.descripcion,
                "fase_id": t.fase_id,
                "area_responsable_id": t.area_responsable_id,
                "area_responsable": t.area_responsable.nombre if t.area_responsable else None,
                "usuario_asignado_id": t.usuario_asignado_id,
                "usuario_asignado": t.usuario_asignado.full_name if t.usuario_asignado else None,
                "fecha_inicio": t.fecha_inicio.isoformat(),
                "fecha_fin": t.fecha_fin.isoformat(),
                "estado": t.estado,
                "dependencia_de": t.dependencia_de
            })
        res.append({
            "id": f.id,
            "nombre": f.nombre,
            "orden": f.orden,
            "fecha_inicio_plan": f.fecha_inicio_plan.isoformat(),
            "fecha_fin_plan": f.fecha_fin_plan.isoformat(),
            "ponderacion": f.ponderacion,
            "tareas": tareas_list
        })
    return res


@router.put("/tareas/{tarea_id}", response_model=TareaRead)
def update_tarea(
    tarea_id: int,
    payload: TareaCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    tarea = db.query(Tarea).filter(Tarea.id == tarea_id).first()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    old_state = tarea.estado
    for key, value in payload.model_dump().items():
        setattr(tarea, key, value)
        
    db.commit()
    db.refresh(tarea)
    
    if old_state != tarea.estado:
        log_action(db, current_user.id, "Actualizar Estado Tarea", "Tarea", {"id": tarea.id, "nombre": tarea.nombre, "anterior": old_state, "nuevo": tarea.estado})
    else:
        log_action(db, current_user.id, "Editar Tarea", "Tarea", {"id": tarea.id, "nombre": tarea.nombre})
        
    return tarea
