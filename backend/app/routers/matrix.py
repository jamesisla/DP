from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import MatrizLevantamiento, Riesgo, User
from app.schemas.domain import MatrizLevantamientoRead

router = APIRouter(tags=["Matriz de Levantamiento"])


def run_automated_risk_analysis(db: Session, matriz: MatrizLevantamiento):
    """5x5 Matrix Rule Engine calculating Probability, Impact, Score, and DPIA necessity."""
    db.query(Riesgo).filter(Riesgo.matriz_id == matriz.id).delete()
    
    treatments = matriz.datos_json if isinstance(matriz.datos_json, list) else []
    area_name = matriz.area.nombre if matriz.area else "Área General"
    
    for t in treatments:
        proceso = t.get("proceso", "Proceso sin nombre")
        sensible = t.get("datos_sensibles", "No").strip().lower() in ["sí", "si", "true"]
        trans_inter = t.get("transferencia_internacional", "No").strip().lower() in ["sí", "si", "true"]
        ia = t.get("uso_ia", "No").strip().lower() in ["sí", "si", "true"]
        volumen_str = str(t.get("volumen", "0"))
        
        try:
            volumen_clean = "".join(filter(str.isdigit, volumen_str))
            volumen = int(volumen_clean) if volumen_clean else 0
        except ValueError:
            volumen = 0
            
        probabilidad = 2
        impacto = 2
        requiere_eipd = False
        nivel = "Bajo"
        desc = ""
        
        # Rule 1: Sensitive data + International transfer -> High/Critical Risk, EIPD Required
        if sensible and trans_inter:
            probabilidad = 4
            impacto = 5
            nivel = "Crítico" if volumen > 1000 else "Alto"
            requiere_eipd = True
            desc = f"Tratamiento '{proceso}' en {area_name}: Alto riesgo debido a transferencia internacional de datos personales sensibles fuera del territorio nacional."
        # Rule 2: High volume + Artificial Intelligence / Profiling -> High Risk, EIPD Required
        elif volumen > 10000 and ia:
            probabilidad = 4
            impacto = 4
            nivel = "Alto"
            requiere_eipd = True
            desc = f"Tratamiento '{proceso}' en {area_name}: Riesgo elevado derivado del uso de Inteligencia Artificial para el perfilamiento o procesamiento masivo de datos (>10.000 registros)."
        # Rule 3: Just sensitive data or AI on medium volume
        elif sensible or (ia and volumen > 1000):
            probabilidad = 3
            impacto = 4
            nivel = "Medio"
            requiere_eipd = False
            desc = f"Tratamiento '{proceso}' en {area_name}: Riesgo moderado debido al uso de categorías especiales de datos o algoritmos automatizados."
        # Rule 4: International transfer of standard data
        elif trans_inter:
            probabilidad = 3
            impacto = 3
            nivel = "Medio"
            requiere_eipd = False
            desc = f"Tratamiento '{proceso}' en {area_name}: Requiere supervisión de cláusulas contractuales tipo para servidores en el extranjero."
        else:
            probabilidad = 2
            impacto = 2
            nivel = "Bajo"
            requiere_eipd = False
            desc = f"Tratamiento '{proceso}' en {area_name}: Riesgo bajo detectado en el flujo general de información administrativa."
            
        puntuacion = probabilidad * impacto
        
        db.add(Riesgo(
            matriz_id=matriz.id,
            nivel=nivel,
            descripcion=desc,
            puntuacion=puntuacion,
            probabilidad=probabilidad,
            impacto=impacto,
            requiere_eipd=requiere_eipd
        ))
        
    db.commit()


@router.get("/matrix/my-area", response_model=list[MatrizLevantamientoRead])
def get_my_area_matrix(current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    if not current_user.area_id:
        return []
    return db.query(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == current_user.area_id).all()


@router.post("/matrix")
def save_matrix_data(
    payload: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    target_area_id = payload.get("area_id") or current_user.area_id
    if not target_area_id:
        raise HTTPException(status_code=400, detail="Se requiere una división o área asignada")
        
    matriz = db.query(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == target_area_id).first()
    
    treatments = payload.get("treatments", [])
    completada = payload.get("completada", False)
    
    if not matriz:
        matriz = MatrizLevantamiento(
            area_id=target_area_id,
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
    
    # Auto-calculate risks
    run_automated_risk_analysis(db, matriz)
    
    return {"status": "success", "matriz_id": matriz.id}


@router.get("/matrix/master")
def get_master_matrix(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    matrices = db.query(MatrizLevantamiento).all()
    master = []
    for m in matrices:
        area_name = m.area.nombre if m.area else "Sin área"
        rows = m.datos_json if isinstance(m.datos_json, list) else []
        for row in rows:
            master.append({
                "id": m.id,
                "area_id": m.area_id,
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
