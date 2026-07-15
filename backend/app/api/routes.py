import io
import json
import zipfile
from datetime import date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import ALGORITHM, create_access_token, verify_password, get_password_hash
from app.models.domain import (
    Area,
    CaseTicket,
    Comentario,
    Consent,
    Documento,
    Fase,
    Finding,
    FlujoAprobacion,
    ImplementationProject,
    LogAuditoria,
    MatrizLevantamiento,
    Proveedor,
    Riesgo,
    Tarea,
    TreatmentActivity,
    User,
)
from app.schemas.domain import (
    ActivityCreate,
    ActivityRead,
    AreaCreate,
    AreaRead,
    ComentarioCreate,
    ComentarioRead,
    ConsentCreate,
    ConsentRead,
    DocumentoCreate,
    DocumentoRead,
    FindingCreate,
    FindingRead,
    LoginRequest,
    LogAuditoriaRead,
    MatrizLevantamientoCreate,
    MatrizLevantamientoRead,
    ProjectRead,
    ProveedorCreate,
    ProveedorRead,
    RiesgoCreate,
    RiesgoRead,
    TareaCreate,
    TareaRead,
    TicketCreate,
    TicketRead,
    Token,
    UserCreate,
    UserRead,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Annotated[Session, Depends(get_db)]) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la sesion",
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


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# Standard login for admin credentials
@router.post("/auth/login", response_model=Token)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> Token:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas")

    return Token(access_token=create_access_token(user.email), user=UserRead.model_validate(user))


# Mock ClaveÚnica Auth redirection endpoint
@router.post("/auth/claveunica", response_model=Token)
def login_claveunica(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> Token:
    user = db.query(User).filter(User.email == payload.email, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no registrado en el sistema")
    
    log_action(db, user.id, "Inicio de Sesión (ClaveÚnica Mock)", "User", {"email": user.email, "role": user.role})
    return Token(access_token=create_access_token(user.email), user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user


# Dashboard implementation
@router.get("/dashboard")
def get_dashboard_data(current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    # Calculate progress according to Anexo B weights
    project = db.query(ImplementationProject).first()
    if not project:
        return {"metrics": [], "phases": [], "focus": [], "critical_path_alert": None, "recent_activity": []}

    fases = db.query(Fase).filter(Fase.proyecto_id == project.id).order_by(Fase.orden.asc()).all()
    
    global_progress = 0.0
    phases_progress = []
    
    for f in fases:
        tasks = f.tareas
        total_tasks = len(tasks)
        if total_tasks > 0:
            completed_tasks = sum(1 for t in tasks if t.estado == "Completada")
            f_progress = (completed_tasks / total_tasks) * 100.0
        else:
            f_progress = 0.0
            
        global_progress += (f_progress * (f.ponderacion / 100.0))
        phases_progress.append({
            "id": f.id,
            "nombre": f.nombre,
            "orden": f.orden,
            "progreso": int(f_progress),
            "ponderacion": f.ponderacion,
            "fecha_inicio": f.fecha_inicio_plan.isoformat(),
            "fecha_fin": f.fecha_fin_plan.isoformat()
        })
        
    # Update project database progress
    project.progress = int(global_progress)
    db.commit()

    # Calculate days left until Dec 1, 2026
    legal_deadline = datetime(2026, 12, 1)
    time_left = legal_deadline - datetime.now()
    days_left = max(0, time_left.days)

    # Check for Critical Path alarms (delayed tasks that lie in late phases)
    critical_path_alert = None
    today = date.today()
    delayed_critical_tasks = db.query(Tarea).join(Fase).filter(
        Tarea.estado != "Completada",
        Tarea.fecha_fin < today
    ).all()
    
    if delayed_critical_tasks:
        critical_task = delayed_critical_tasks[0]
        critical_path_alert = f"Advertencia: Para cumplir con la fecha legal, debes finalizar la tarea crítica '{critical_task.nombre}' del área {critical_task.area_responsable.nombre if critical_task.area_responsable else 'Legal'} (debía finalizar el {critical_task.fecha_fin.strftime('%d/%m/%Y')})."

    # Get recent audit activity feed
    logs = db.query(LogAuditoria).order_by(LogAuditoria.fecha_hora.desc()).limit(10).all()
    recent_activity = [
        {
            "id": log.id,
            "usuario": log.usuario.full_name if log.usuario else "Sistema",
            "accion": log.accion,
            "fecha_hora": log.fecha_hora.strftime("%Y-%m-%d %H:%M:%S"),
            "detalle": log.detalle_json
        } for log in logs
    ]

    metrics = [
        {"label": "Avance General", "value": f"{int(global_progress)}%", "trend": "según ponderaciones"},
        {"label": "Días Restantes (Ley 21.719)", "value": str(days_left), "trend": "Plazo: 01 Dic 2026"},
        {"label": "Tareas Completadas", "value": f"{db.query(Tarea).filter(Tarea.estado == 'Completada').count()}/{db.query(Tarea).count()}", "trend": "tareas activas"},
        {"label": "Proveedores Registrados", "value": str(db.query(Proveedor).count()), "trend": "con tratamiento de datos"}
    ]

    focus = [
        "Completar Wizard de Levantamiento de Información en todas las áreas de servicio.",
        "Analizar riesgos en la Ficha Social y coordinar la actualización de cláusulas de transferencia internacional.",
        "Enviar borrador de Política de Privacidad para comentarios del Comité Ejecutivo.",
    ]

    return {
        "user": current_user.full_name,
        "metrics": metrics,
        "phases": phases_progress,
        "focus": focus,
        "critical_path_alert": critical_path_alert,
        "recent_activity": recent_activity
    }


# Area CRUD
@router.get("/areas", response_model=list[AreaRead])
def get_areas(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(Area).order_by(Area.id.asc()).all()


@router.post("/areas", response_model=AreaRead, status_code=status.HTTP_201_CREATED)
def create_area(payload: AreaCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    area = Area(**payload.model_dump())
    db.add(area)
    db.commit()
    db.refresh(area)
    log_action(db, current_user.id, "Crear Área", "Area", {"id": area.id, "nombre": area.nombre})
    return area


# User CRUD
@router.get("/users", response_model=list[UserRead])
def get_users(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(User).order_by(User.id.asc()).all()


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
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
def update_user(id: int, payload: UserCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
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
def delete_user(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")
        
    log_action(db, current_user.id, "Eliminar Funcionario", "User", {"id": db_user.id, "email": db_user.email})
    db.delete(db_user)
    db.commit()
    return None


# Projects & Gantt endpoints
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
                "area_responsable": t.area_responsable.nombre if t.area_responsable else None,
                "usuario_asignado": t.usuario_assigned.full_name if hasattr(t, 'usuario_assigned') and t.usuario_assigned else (t.usuario_asignado.full_name if t.usuario_asignado else None),
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
def update_tarea(tarea_id: int, payload: TareaCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
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


# Wizard / Matriz endpoints
@router.get("/matrix/my-area", response_model=list[MatrizLevantamientoRead])
def get_my_area_matrix(current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    if not current_user.area_id:
        return []
    return db.query(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == current_user.area_id).all()


@router.post("/matrix")
def save_matrix_data(payload: dict, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    if not current_user.area_id:
        raise HTTPException(status_code=400, detail="El usuario no tiene una división asignada")
        
    matriz = db.query(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == current_user.area_id).first()
    
    # Payload is expected to contain "treatments" list
    treatments = payload.get("treatments", [])
    completada = payload.get("completada", False)
    
    if not matriz:
        matriz = MatrizLevantamiento(
            area_id=current_user.area_id,
            datos_json=treatments,
            completada=completada
        )
        db.add(matriz)
    else:
        matriz.datos_json = treatments
        matriz.completada = completada
        
    db.commit()
    db.refresh(matriz)
    
    log_action(db, current_user.id, "Guardar Levantamiento Matriz", "MatrizLevantamiento", {"id": matriz.id, "completada": completada, "cantidad_tratamientos": len(treatments)})
    
    # Auto-run risk analyzer on submission
    run_automated_risk_analysis(db, matriz)
    
    return {"status": "success", "matriz_id": matriz.id}


@router.get("/matrix/master")
def get_master_matrix(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    # Consolidates all matrices into one single view
    matrices = db.query(MatrizLevantamiento).all()
    master = []
    for m in matrices:
        area_name = m.area.nombre
        for row in m.datos_json:
            master.append({
                "id": m.id,
                "area": area_name,
                "proceso": row.get("proceso", "No especificado"),
                "tipo_datos": row.get("tipo_datos", ""),
                "datos_sensibles": row.get("datos_sensibles", "No"),
                "finalidad": row.get("finalidad", ""),
                "base_legal": row.get("base_legal", ""),
                "origen": row.get("origen", ""),
                "almacenamiento": row.get("almacenamiento", ""),
                "acceso": row.get("acceso", ""),
                "transferencia_internacional": row.get("transferencia_internacional", "No"),
                "encargado": row.get("encargado", ""),
                "medidas_seguridad": row.get("medidas_seguridad", ""),
                "plazo_conservacion": row.get("plazo_conservacion", ""),
                "uso_ia": row.get("uso_ia", "No"),
                "volumen": row.get("volumen", "")
            })
    return master


# Risk engine automated triggers
def run_automated_risk_analysis(db: Session, matriz: MatrizLevantamiento):
    # Wipes old calculated risks for this matrix
    db.query(Riesgo).filter(Riesgo.matriz_id == matriz.id).delete()
    
    treatments = matriz.datos_json
    area_name = matriz.area.nombre
    
    for t in treatments:
        proceso = t.get("proceso", "Proceso sin nombre")
        sensible = t.get("datos_sensibles", "No")
        trans_inter = t.get("transferencia_internacional", "No")
        volumen_str = t.get("volumen", "0")
        ia = t.get("uso_ia", "No")
        
        # Parse volume
        try:
            volumen_clean = "".join(filter(str.isdigit, volumen_str))
            volumen = int(volumen_clean) if volumen_clean else 0
        except ValueError:
            volumen = 0
            
        nivel = "Bajo"
        puntuacion = 4
        desc = ""
        
        # Rule 1: Sensitive data + International transfer -> High Risk
        if (sensible.lower() == "sí" or sensible.lower() == "si") and (trans_inter.lower() == "sí" or trans_inter.lower() == "si"):
            nivel = "Alto"
            puntuacion = 18
            desc = f"Tratamiento '{proceso}' en {area_name}: Alto riesgo debido a transferencia internacional de datos personales de carácter sensible."
        # Rule 2: Volume > 10,000 + Artificial Intelligence -> Medium Risk
        elif volumen > 10000 and (ia.lower() == "sí" or ia.lower() == "si"):
            nivel = "Medio"
            puntuacion = 12
            desc = f"Tratamiento '{proceso}' en {area_name}: Riesgo medio derivado del uso de Inteligencia Artificial para el procesamiento masivo de datos (>10k registros)."
        # Rule 3: Just sensitive data -> Medium Risk
        elif sensible.lower() == "sí" or sensible.lower() == "si":
            nivel = "Medio"
            puntuacion = 10
            desc = f"Tratamiento '{proceso}' en {area_name}: Riesgo moderado debido al uso de datos de carácter sensible."
        else:
            nivel = "Bajo"
            puntuacion = 3
            desc = f"Tratamiento '{proceso}' en {area_name}: Riesgo bajo detectado en el flujo de información de datos generales."
            
        db.add(Riesgo(
            matriz_id=matriz.id,
            nivel=nivel,
            descripcion=desc,
            puntuacion=puntuacion
        ))
        
    db.commit()


@router.get("/risks", response_model=list[RiesgoRead])
def get_risks(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(Riesgo).order_by(Riesgo.puntuacion.desc()).all()


@router.get("/risks/heatmap")
def get_heatmap(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    areas = db.query(Area).all()
    res = []
    for a in areas:
        alto = db.query(Riesgo).join(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == a.id, Riesgo.nivel == "Alto").count()
        medio = db.query(Riesgo).join(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == a.id, Riesgo.nivel == "Medio").count()
        bajo = db.query(Riesgo).join(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == a.id, Riesgo.nivel == "Bajo").count()
        res.append({
            "area": a.nombre,
            "Alto": alto,
            "Medio": medio,
            "Bajo": bajo
        })
    return res


@router.get("/risks/report")
def get_risks_report(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    risks = db.query(Riesgo).order_by(Riesgo.puntuacion.desc()).all()
    
    report = "# INFORME DE HALLAZGOS Y ANÁLISIS DE RIESGOS - LEY 21.719\n"
    report += f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
    report += "Servicio Público de la Administración del Estado de Chile\n\n"
    report += "## 1. Resumen Ejecutivo\n"
    report += "Este informe automatizado recopila las brechas críticas y riesgos evaluados en las divisiones de la institución.\n\n"
    report += "## 2. Detalle de Riesgos Identificados\n"
    
    for r in risks:
        report += f"### [{r.nivel.upper()}] Puntuación: {r.puntuacion}/25\n"
        report += f"- **Descripción:** {r.descripcion}\n"
        report += "- **Recomendación General:** "
        if r.nivel == "Alto":
            report += "Se requiere un Acuerdo de Transferencia Internacional de Datos de forma urgente o encriptación de extremo a extremo.\n\n"
        elif r.nivel == "Medio":
            report += "Establecer políticas claras de consentimiento expreso y regular los algoritmos de IA utilizados.\n\n"
        else:
            report += "Mantener controles de accesos lógicos y bitácora de auditorías.\n\n"

    headers = {"Content-Disposition": "attachment; filename=Informe_Hallazgos_Riesgos.md"}
    return StreamingResponse(io.BytesIO(report.encode("utf-8")), media_type="text/markdown", headers=headers)


# Document Editor & Autocomplete endpoints
@router.get("/documents", response_model=list[DocumentoRead])
def get_documents(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(Documento).order_by(Documento.id.asc()).all()


@router.get("/documents/{id}", response_model=DocumentoRead)
def get_document(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    doc = db.query(Documento).filter(Documento.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return doc


@router.put("/documents/{id}", response_model=DocumentoRead)
def update_document(id: int, payload: DocumentoCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    doc = db.query(Documento).filter(Documento.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    doc.contenido = payload.contenido
    doc.version = payload.version
    doc.estado = payload.estado
    
    db.commit()
    db.refresh(doc)
    
    log_action(db, current_user.id, "Guardar Borrador Documento", "Documento", {"id": doc.id, "tipo": doc.tipo, "version": doc.version})
    return doc


@router.post("/documents/{id}/autocomplete", response_model=DocumentoRead)
def autocomplete_document(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    doc = db.query(Documento).filter(Documento.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    # Consolidate Matrix data
    matrices = db.query(MatrizLevantamiento).all()
    sensibles = []
    finalidades = []
    medidas = []
    catalogo_rows = []
    
    for m in matrices:
        for r in m.datos_json:
            proc = r.get("proceso", "")
            sens = r.get("datos_sensibles", "No")
            t_datos = r.get("tipo_datos", "")
            fin = r.get("finalidad", "")
            med = r.get("medidas_seguridad", "")
            base = r.get("base_legal", "")
            
            if sens.lower() == "sí" or sens.lower() == "si":
                sensibles.append(f"- **{proc}** (Área: {m.area.nombre}): trata {t_datos}")
            
            if fin:
                finalidades.append(f"- **Para {proc}**: {fin}")
                
            if med:
                medidas.append(f"- **En {proc}**: {med}")
                
            catalogo_rows.append(f"| {proc} | {m.area.nombre} | {t_datos} | {base} |")

    sensibles_txt = "\n".join(sensibles) if sensibles else "No se detectaron tratamientos de datos sensibles."
    finalidades_txt = "\n".join(finalidades) if finalidades else "No se especificaron finalidades en el levantamiento."
    medidas_txt = "\n".join(medidas) if medidas else "No se especificaron medidas específicas en el levantamiento."
    
    catalogo_table = "| Actividad | Área Responsable | Datos Personales Tratados | Base Legal |\n"
    catalogo_table += "| :--- | :--- | :--- | :--- |\n"
    catalogo_table += "\n".join(catalogo_rows) if catalogo_rows else "| Sin registros | - | - | - |"

    # Inject into document variables
    content = doc.contenido
    content = content.replace("{{lista_datos_sensibles}}", sensibles_txt)
    content = content.replace("{{finalidades}}", finalidades_txt)
    content = content.replace("{{medidas_seguridad}}", medidas_txt)
    content = content.replace("{{catalogo}}", catalogo_table)
    
    doc.contenido = content
    db.commit()
    db.refresh(doc)
    
    log_action(db, current_user.id, "Autocompletado Inteligente Documento", "Documento", {"id": doc.id, "tipo": doc.tipo})
    return doc


@router.post("/documents/{id}/comments", response_model=ComentarioRead)
def add_comment(id: int, payload: ComentarioCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    comentario = Comentario(
        documento_id=id,
        usuario_id=current_user.id,
        texto=payload.texto,
        parent_id=payload.parent_id
    )
    db.add(comentario)
    db.commit()
    db.refresh(comentario)
    
    log_action(db, current_user.id, "Agregar Comentario", "Comentario", {"id": comentario.id, "documento_id": id})
    return comentario


@router.post("/documents/{id}/approve", response_model=DocumentoRead)
def approve_document(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    doc = db.query(Documento).filter(Documento.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
        
    old_state = doc.estado
    
    # State transitions: borrador -> revision -> aprobado -> firmado
    if doc.estado == "borrador":
        doc.estado = "revision"
    elif doc.estado == "revision":
        doc.estado = "aprobado"
    elif doc.estado == "aprobado":
        doc.estado = "firmado"
        
    db.commit()
    db.refresh(doc)
    
    # Save approval flow track
    flow = FlujoAprobacion(
        documento_id=doc.id,
        estado_actual=doc.estado,
        usuario_origen_id=current_user.id,
        usuario_destino_id=None,
        fecha=datetime.now()
    )
    db.add(flow)
    db.commit()
    
    log_action(db, current_user.id, "Cambio Estado Aprobación", "Documento", {"id": doc.id, "anterior": old_state, "nuevo": doc.estado})
    
    # If transitioning to aprobado or firmado, create a mock PDF/Text Acta de Aprobación
    if doc.estado in ["aprobado", "firmado"]:
        acta_content = f"# ACTA DE APROBACIÓN DE DOCUMENTO - SIGE-DP\n"
        acta_content += f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        acta_content += f"Documento: {doc.tipo.upper()} (Versión: {doc.version})\n"
        acta_content += f"Estado de Flujo: {doc.estado.upper()}\n\n"
        acta_content += f"Aprobado por: {current_user.full_name} ({current_user.role})\n"
        acta_content += "Observaciones del Comité:\n"
        
        comentarios = db.query(Comentario).filter(Comentario.documento_id == doc.id).all()
        for c in comentarios:
            acta_content += f"- [{c.usuario.full_name}]: {c.texto}\n"
            
        # Store log of Acta
        log_action(db, current_user.id, "Generar Acta de Aprobación", "Documento", {"id": doc.id, "acta": acta_content})
        
    return doc


@router.get("/documents/{id}/acta")
def download_acta(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    doc = db.query(Documento).filter(Documento.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
        
    acta = f"# ACTA OFICIAL DE APROBACIÓN\n"
    acta += f"Organismo: Administración del Estado - SIGE-DP Chile\n"
    acta += f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n"
    acta += f"Documento Referenciado: {doc.tipo.upper()} v{doc.version}\n"
    acta += f"Estado Actual: {doc.estado.upper()}\n\n"
    acta += "## Historial de Comentarios del Comité Ejecutivo:\n"
    
    comentarios = db.query(Comentario).filter(Comentario.documento_id == doc.id).all()
    for c in comentarios:
        acta += f"- **{c.usuario.full_name}** ({c.usuario.role}) - {c.fecha.strftime('%d/%m/%Y %H:%M')}:\n"
        acta += f"  \"{c.texto}\"\n\n"
        
    acta += "\n## Firmas Digitales y Constancias:\n"
    flows = db.query(FlujoAprobacion).filter(FlujoAprobacion.documento_id == doc.id).all()
    for f in flows:
        acta += f"- Estado '{f.estado_actual}' registrado el {f.fecha.strftime('%d/%m/%Y %H:%M')} por {f.usuario_origen.full_name if f.usuario_origen else 'Sistema'}\n"
        
    headers = {"Content-Disposition": f"attachment; filename=Acta_Aprobacion_{doc.tipo}.md"}
    return StreamingResponse(io.BytesIO(acta.encode("utf-8")), media_type="text/markdown", headers=headers)


# Third-party / Proveedores CRUD
@router.get("/proveedores", response_model=list[ProveedorRead])
def get_proveedores(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(Proveedor).order_by(Proveedor.id.asc()).all()


@router.post("/proveedores", response_model=ProveedorRead, status_code=status.HTTP_201_CREATED)
def create_proveedor(payload: ProveedorCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    prov = Proveedor(**payload.model_dump())
    db.add(prov)
    db.commit()
    db.refresh(prov)
    log_action(db, current_user.id, "Registrar Proveedor", "Proveedor", {"id": prov.id, "nombre": prov.nombre})
    return prov


@router.delete("/proveedores/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proveedor(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    prov = db.query(Proveedor).filter(Proveedor.id == id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    log_action(db, current_user.id, "Eliminar Proveedor", "Proveedor", {"id": prov.id, "nombre": prov.nombre})
    db.delete(prov)
    db.commit()
    return None


@router.get("/proveedores/{id}/annex")
def get_proveedor_annex(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    prov = db.query(Proveedor).filter(Proveedor.id == id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        
    annex = f"# ANEXO REGULATORIO DE PROTECCIÓN DE DATOS PERSONALES (Licitación Ley 21.719)\n\n"
    annex += f"Entre el Servicio Público del Estado y el Proveedor **{prov.nombre}** (RUT: {prov.rut}).\n\n"
    annex += "### 1. Objeto\n"
    annex += f"El presente anexo regula las obligaciones de protección de datos en relación al servicio de '{prov.servicio}' contratado.\n\n"
    annex += "### 2. Calidad del Tratamiento\n"
    annex += f"El Proveedor actuará en calidad de **Encargado de Tratamiento** por cuenta del Servicio (Responsable), y se compromete a tratar los datos únicamente para los fines del contrato.\n\n"
    annex += "### 3. Obligaciones y Medidas de Seguridad\n"
    annex += "- Cifrado de las comunicaciones de datos.\n"
    annex += "- Reportar cualquier brecha de seguridad en menos de 24 horas al DPO del Servicio.\n"
    annex += f"- Vigencia del tratamiento: desde el {prov.fecha_contrato_inicio.strftime('%d/%m/%Y')} hasta el {prov.fecha_contrato_fin.strftime('%d/%m/%Y')}.\n\n"
    annex += "### 4. Firma de Declaración de Conformidad\n"
    annex += f"Firmado digitalmente por representante de {prov.nombre} en fecha de vigencia contractual.\n"

    headers = {"Content-Disposition": f"attachment; filename=Anexo_Proteccion_Datos_{prov.nombre.replace(' ', '_')}.md"}
    return StreamingResponse(io.BytesIO(annex.encode("utf-8")), media_type="text/markdown", headers=headers)


# Audit Logs
@router.get("/audit-logs", response_model=list[LogAuditoriaRead])
def get_audit_logs(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(LogAuditoria).order_by(LogAuditoria.fecha_hora.desc()).all()


# Evidence ZIP Pack compilation
@router.get("/evidence-zip")
def download_evidence_zip(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    # In-memory ZIP compilation
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        # Phase 1: Institutional design
        zip_file.writestr(
            "Fase_1_Primeros_Pasos/Acta_Designacion_DPO.txt", 
            "Acta de designación formal de Encargado de Protección de Datos (DPO Demo)."
        )
        
        # Phase 2: Consolidated Matrix
        matrices = db.query(MatrizLevantamiento).all()
        matrix_rows = []
        for m in matrices:
            matrix_rows.append(f"### Área: {m.area.nombre} (Completada: {m.completada})")
            matrix_rows.append(json.dumps(m.datos_json, indent=2, ensure_ascii=False))
            matrix_rows.append("\n" + "="*40 + "\n")
        
        zip_file.writestr(
            "Fase_2_Levantamiento/Matriz_Consolidada.txt", 
            "\n".join(matrix_rows) if matrix_rows else "No hay matrices levantadas."
        )
        
        # Phase 3: Risk findings
        risks = db.query(Riesgo).all()
        risk_lines = ["# REPORTE DE BRECHAS Y ANÁLISIS DE RIESGOS"]
        for r in risks:
            risk_lines.append(f"- [{r.nivel}] Puntuación {r.puntuacion}: {r.descripcion}")
        zip_file.writestr(
            "Fase_3_Analisis/Informe_Riesgos_Consolidado.txt", 
            "\n".join(risk_lines)
        )
        
        # Phase 4 & 5: Documents generated
        docs = db.query(Documento).all()
        for d in docs:
            folder = "Fase_4_Catalogo" if d.tipo == "catalogo" else "Fase_5_Politica"
            zip_file.writestr(
                f"{folder}/Documento_{d.tipo}_v{d.version}.txt",
                d.contenido
            )
            
            # Add Acta if approved/signed
            if d.estado in ["aprobado", "firmado"]:
                zip_file.writestr(
                    f"{folder}/Acta_Aprobacion_{d.tipo}.txt",
                    f"Documento {d.tipo} aprobado con actas de firmas digitales registradas."
                )

        # Audit Logs
        logs = db.query(LogAuditoria).order_by(LogAuditoria.fecha_hora.asc()).all()
        log_lines = ["ID | Fecha Hora | Usuario | Acción | Entidad"]
        for l in logs:
            uname = l.usuario.full_name if l.usuario else "Sistema"
            log_lines.append(f"{l.id} | {l.fecha_hora.isoformat()} | {uname} | {l.accion} | {l.entidad_afectada}")
        zip_file.writestr(
            "Auditoria_Trazabilidad/Bitacora_Logs.txt",
            "\n".join(log_lines)
        )
        
    zip_buffer.seek(0)
    
    headers = {"Content-Disposition": "attachment; filename=Expediente_Evidencias_SIGE_DP.zip"}
    return StreamingResponse(zip_buffer, media_type="application/zip", headers=headers)


# Backward Compatibility Routes (so MVP tables and UI forms still run without breaking)
@router.get("/activities", response_model=list[ActivityRead])
def get_activities(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> list[TreatmentActivity]:
    return db.query(TreatmentActivity).order_by(TreatmentActivity.id.asc()).all()


@router.post("/activities", response_model=ActivityRead, status_code=status.HTTP_201_CREATED)
def create_activity(payload: ActivityCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> TreatmentActivity:
    db_activity = TreatmentActivity(**payload.model_dump())
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    log_action(db, current_user.id, "Crear Actividad MVP", "TreatmentActivity", {"id": db_activity.id, "nombre": db_activity.name})
    return db_activity


@router.put("/activities/{id}", response_model=ActivityRead)
def update_activity(id: int, payload: ActivityCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> TreatmentActivity:
    db_activity = db.query(TreatmentActivity).filter(TreatmentActivity.id == id).first()
    if not db_activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    for key, value in payload.model_dump().items():
        setattr(db_activity, key, value)
    db.commit()
    db.refresh(db_activity)
    log_action(db, current_user.id, "Editar Actividad MVP", "TreatmentActivity", {"id": id})
    return db_activity


@router.delete("/activities/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    db_activity = db.query(TreatmentActivity).filter(TreatmentActivity.id == id).first()
    if not db_activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    log_action(db, current_user.id, "Eliminar Actividad MVP", "TreatmentActivity", {"id": id, "nombre": db_activity.name})
    db.delete(db_activity)
    db.commit()
    return None


@router.get("/findings", response_model=list[FindingRead])
def get_findings(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> list[Finding]:
    return db.query(Finding).order_by(Finding.id.asc()).all()


@router.post("/findings", response_model=FindingRead, status_code=status.HTTP_201_CREATED)
def create_finding(payload: FindingCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> Finding:
    db_finding = Finding(**payload.model_dump())
    db.add(db_finding)
    db.commit()
    db.refresh(db_finding)
    log_action(db, current_user.id, "Crear Hallazgo MVP", "Finding", {"id": db_finding.id, "titulo": db_finding.title})
    return db_finding


@router.put("/findings/{id}", response_model=FindingRead)
def update_finding(id: int, payload: FindingCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> Finding:
    db_finding = db.query(Finding).filter(Finding.id == id).first()
    if not db_finding:
        raise HTTPException(status_code=404, detail="Hallazgo no encontrado")
    for key, value in payload.model_dump().items():
        setattr(db_finding, key, value)
    db.commit()
    db.refresh(db_finding)
    log_action(db, current_user.id, "Editar Hallazgo MVP", "Finding", {"id": id})
    return db_finding


@router.delete("/findings/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_finding(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    db_finding = db.query(Finding).filter(Finding.id == id).first()
    if not db_finding:
        raise HTTPException(status_code=404, detail="Hallazgo no encontrado")
    log_action(db, current_user.id, "Eliminar Hallazgo MVP", "Finding", {"id": id})
    db.delete(db_finding)
    db.commit()
    return None


@router.get("/consents", response_model=list[ConsentRead])
def get_consents(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> list[Consent]:
    return db.query(Consent).order_by(Consent.id.asc()).all()


@router.post("/consents", response_model=ConsentRead, status_code=status.HTTP_201_CREATED)
def create_consent(payload: ConsentCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> Consent:
    db_consent = Consent(**payload.model_dump())
    db.add(db_consent)
    db.commit()
    db.refresh(db_consent)
    log_action(db, current_user.id, "Crear Consentimiento MVP", "Consent", {"id": db_consent.id})
    return db_consent


@router.put("/consents/{id}", response_model=ConsentRead)
def update_consent(id: int, payload: ConsentCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> Consent:
    db_consent = db.query(Consent).filter(Consent.id == id).first()
    if not db_consent:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")
    for key, value in payload.model_dump().items():
        setattr(db_consent, key, value)
    db.commit()
    db.refresh(db_consent)
    log_action(db, current_user.id, "Editar Consentimiento MVP", "Consent", {"id": id})
    return db_consent


@router.delete("/consents/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_consent(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    db_consent = db.query(Consent).filter(Consent.id == id).first()
    if not db_consent:
        raise HTTPException(status_code=404, detail="Consentimiento no encontrado")
    log_action(db, current_user.id, "Eliminar Consentimiento MVP", "Consent", {"id": id})
    db.delete(db_consent)
    db.commit()
    return None


@router.get("/tickets", response_model=list[TicketRead])
def get_tickets(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> list[CaseTicket]:
    return db.query(CaseTicket).order_by(CaseTicket.id.asc()).all()


@router.post("/tickets", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_ticket(payload: TicketCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> CaseTicket:
    db_ticket = CaseTicket(**payload.model_dump())
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    log_action(db, current_user.id, "Crear Ticket MVP", "CaseTicket", {"id": db_ticket.id})
    return db_ticket


@router.put("/tickets/{id}", response_model=TicketRead)
def update_ticket(id: int, payload: TicketCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> CaseTicket:
    db_ticket = db.query(CaseTicket).filter(CaseTicket.id == id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    for key, value in payload.model_dump().items():
        setattr(db_ticket, key, value)
    db.commit()
    db.refresh(db_ticket)
    log_action(db, current_user.id, "Editar Ticket MVP", "CaseTicket", {"id": id})
    return db_ticket


@router.delete("/tickets/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    db_ticket = db.query(CaseTicket).filter(CaseTicket.id == id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    log_action(db, current_user.id, "Eliminar Ticket MVP", "CaseTicket", {"id": id})
    db.delete(db_ticket)
    db.commit()
    return None
