from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import Fase, ImplementationProject, Tarea, User
from app.schemas.domain import ProjectRead, TareaCreate, TareaRead

router = APIRouter(tags=["Proyectos y Tareas"])


def recalculate_project_progress(project_id: int, db: Session) -> int:
    """Recalcula el progreso ponderado del proyecto de Protección de Datos."""
    fases = db.query(Fase).filter(Fase.proyecto_id == project_id).all()
    if not fases:
        return 0
        
    total_progress = 0.0
    for f in fases:
        if f.resuelto_externamente:
            total_progress += f.ponderacion
        else:
            total_tasks = len(f.tareas)
            completed_tasks = sum(1 for t in f.tareas if t.estado == "Completada")
            phase_prog = (completed_tasks / total_tasks) if total_tasks > 0 else 0.0
            total_progress += phase_prog * f.ponderacion
            
    proj = db.query(ImplementationProject).filter(ImplementationProject.id == project_id).first()
    if proj:
        proj.progress = min(100, int(round(total_progress)))
        db.commit()
        return proj.progress
    return 0


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
            
        total_tasks = len(f.tareas)
        completed_tasks = sum(1 for t in f.tareas if t.estado == "Completada")
        progreso = 100 if f.resuelto_externamente else (int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0)

        res.append({
            "id": f.id,
            "nombre": f.nombre,
            "orden": f.orden,
            "fecha_inicio_plan": f.fecha_inicio_plan.isoformat(),
            "fecha_fin_plan": f.fecha_fin_plan.isoformat(),
            "ponderacion": f.ponderacion,
            "resuelto_externamente": f.resuelto_externamente,
            "motivo_resuelto_externo": f.motivo_resuelto_externo,
            "progreso": progreso,
            "total_tareas": total_tasks,
            "tareas_completadas": completed_tasks,
            "tareas": tareas_list
        })
    return res


@router.put("/fases/{fase_id}/toggle-externo")
def toggle_fase_externo(
    fase_id: int,
    payload: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """Marca una fase como resuelta externamente (ej. ISO 27001 o auditoría previa)."""
    fase = db.query(Fase).filter(Fase.id == fase_id).first()
    if not fase:
        raise HTTPException(status_code=404, detail="Fase no encontrada")
        
    fase.resuelto_externamente = payload.get("resuelto_externamente", not fase.resuelto_externamente)
    fase.motivo_resuelto_externo = payload.get("motivo_resuelto_externo", "Homologado mediante certificación o auditoría previa")
    db.commit()
    
    recalculate_project_progress(fase.proyecto_id, db)
    log_action(db, current_user.id, "Homologación Externa Fase", "Fase", {"fase_id": fase.id, "resuelto_externamente": fase.resuelto_externamente})
    return {"status": "ok", "resuelto_externamente": fase.resuelto_externamente, "motivo": fase.motivo_resuelto_externo}


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
    
    # Recalculate project progress
    fase = db.query(Fase).filter(Fase.id == tarea.fase_id).first()
    if fase:
        recalculate_project_progress(fase.proyecto_id, db)
    
    if old_state != tarea.estado:
        log_action(db, current_user.id, "Actualizar Estado Tarea", "Tarea", {"id": tarea.id, "nombre": tarea.nombre, "anterior": old_state, "nuevo": tarea.estado})
    else:
        log_action(db, current_user.id, "Editar Tarea", "Tarea", {"id": tarea.id, "nombre": tarea.nombre})
        
    return tarea

