from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes import router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.seed import seed_initial_data


def auto_migrate_sqlite() -> None:
    if settings.database_url.startswith("sqlite"):
        with engine.connect() as conn:
            # Users migrations
            try:
                res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                columns = [row[1] for row in res]
                if columns:
                    if "rut" not in columns:
                        conn.execute(text("ALTER TABLE users ADD COLUMN rut VARCHAR(20)"))
                    if "cargo" not in columns:
                        conn.execute(text("ALTER TABLE users ADD COLUMN cargo VARCHAR(160)"))
                    if "clave_unica_token" not in columns:
                        conn.execute(text("ALTER TABLE users ADD COLUMN clave_unica_token VARCHAR(255)"))
                    conn.commit()
            except Exception as e:
                print(f"[auto_migrate_users] Notice: {e}")

            # Cyber Assets migrations
            try:
                res = conn.execute(text("PRAGMA table_info(cyber_assets)")).fetchall()
                columns = [row[1] for row in res]
                if columns:
                    if "capa_tecnologica" not in columns:
                        conn.execute(text("ALTER TABLE cyber_assets ADD COLUMN capa_tecnologica VARCHAR(60) DEFAULT 'Servidor'"))
                    if "puertos_expuestos" not in columns:
                        conn.execute(text("ALTER TABLE cyber_assets ADD COLUMN puertos_expuestos VARCHAR(160) DEFAULT '443/tcp, 22/tcp'"))
                    if "version_so" not in columns:
                        conn.execute(text("ALTER TABLE cyber_assets ADD COLUMN version_so VARCHAR(120) DEFAULT 'Ubuntu 24.04 LTS'"))
                    if "impacto_caida_servicio" not in columns:
                        conn.execute(text("ALTER TABLE cyber_assets ADD COLUMN impacto_caida_servicio VARCHAR(200) DEFAULT 'Interrupción de servicio'"))
                    if "dependencias_ids" not in columns:
                        conn.execute(text("ALTER TABLE cyber_assets ADD COLUMN dependencias_ids JSON DEFAULT '[]'"))
                    if "alberga_datos_personales" not in columns:
                        conn.execute(text("ALTER TABLE cyber_assets ADD COLUMN alberga_datos_personales BOOLEAN DEFAULT 0"))
                    if "tratamientos_asociados" not in columns:
                        conn.execute(text("ALTER TABLE cyber_assets ADD COLUMN tratamientos_asociados VARCHAR(255) DEFAULT ''"))
                    if "sensibilidad_datos" not in columns:
                        conn.execute(text("ALTER TABLE cyber_assets ADD COLUMN sensibilidad_datos VARCHAR(80) DEFAULT 'Sin Datos Personales'"))
                    conn.commit()
            except Exception as e:
                print(f"[auto_migrate_cyber_assets] Notice: {e}")

            # Cyber Incidents migrations
            try:
                res = conn.execute(text("PRAGMA table_info(cyber_incidents_anci)")).fetchall()
                columns = [row[1] for row in res]
                if columns:
                    if "iocs_json" not in columns:
                        conn.execute(text("ALTER TABLE cyber_incidents_anci ADD COLUMN iocs_json JSON DEFAULT '{}'"))
                    if "checklist_forense_json" not in columns:
                        conn.execute(text("ALTER TABLE cyber_incidents_anci ADD COLUMN checklist_forense_json JSON DEFAULT '{}'"))
                    if "tiempo_deteccion_minutos" not in columns:
                        conn.execute(text("ALTER TABLE cyber_incidents_anci ADD COLUMN tiempo_deteccion_minutos INTEGER DEFAULT 15"))
                    if "afecta_datos_personales" not in columns:
                        conn.execute(text("ALTER TABLE cyber_incidents_anci ADD COLUMN afecta_datos_personales BOOLEAN DEFAULT 0"))
                    if "brecha_seguridad_id" not in columns:
                        conn.execute(text("ALTER TABLE cyber_incidents_anci ADD COLUMN brecha_seguridad_id INTEGER"))
                    if "codigo_brecha_relacionada" not in columns:
                        conn.execute(text("ALTER TABLE cyber_incidents_anci ADD COLUMN codigo_brecha_relacionada VARCHAR(50)"))
                    if "tratamientos_afectados" not in columns:
                        conn.execute(text("ALTER TABLE cyber_incidents_anci ADD COLUMN tratamientos_afectados VARCHAR(255) DEFAULT ''"))
                    conn.commit()
            except Exception as e:
                print(f"[auto_migrate_cyber_incidents] Notice: {e}")

            # Security Breaches cross-correlation migrations
            try:
                res = conn.execute(text("PRAGMA table_info(security_breaches)")).fetchall()
                columns = [row[1] for row in res]
                if columns:
                    if "origen_ciberseguridad" not in columns:
                        conn.execute(text("ALTER TABLE security_breaches ADD COLUMN origen_ciberseguridad BOOLEAN DEFAULT 0"))
                    if "incidente_anci_id" not in columns:
                        conn.execute(text("ALTER TABLE security_breaches ADD COLUMN incidente_anci_id INTEGER"))
                    if "codigo_incidente_ciber" not in columns:
                        conn.execute(text("ALTER TABLE security_breaches ADD COLUMN codigo_incidente_ciber VARCHAR(50)"))
                    if "activo_rsic_afectado" not in columns:
                        conn.execute(text("ALTER TABLE security_breaches ADD COLUMN activo_rsic_afectado VARCHAR(180) DEFAULT ''"))
                    conn.commit()
            except Exception as e:
                print(f"[auto_migrate_security_breaches] Notice: {e}")

            # Proveedores Supply Chain migrations
            try:
                res = conn.execute(text("PRAGMA table_info(proveedores)")).fetchall()
                columns = [row[1] for row in res]
                if columns:
                    if "criticidad_ciber" not in columns:
                        conn.execute(text("ALTER TABLE proveedores ADD COLUMN criticidad_ciber VARCHAR(40) DEFAULT 'Medio'"))
                    if "clausula_anci_firmada" not in columns:
                        conn.execute(text("ALTER TABLE proveedores ADD COLUMN clausula_anci_firmada BOOLEAN DEFAULT 1"))
                    if "dpa_firmado" not in columns:
                        conn.execute(text("ALTER TABLE proveedores ADD COLUMN dpa_firmado BOOLEAN DEFAULT 1"))
                    if "pais_alojamiento" not in columns:
                        conn.execute(text("ALTER TABLE proveedores ADD COLUMN pais_alojamiento VARCHAR(80) DEFAULT 'Chile'"))
                    if "sla_notificacion_horas" not in columns:
                        conn.execute(text("ALTER TABLE proveedores ADD COLUMN sla_notificacion_horas INTEGER DEFAULT 24"))
                    if "evaluacion_seguridad" not in columns:
                        conn.execute(text("ALTER TABLE proveedores ADD COLUMN evaluacion_seguridad VARCHAR(100) DEFAULT 'Conforme ISO 27001 / SOC 2'"))
                    if "transferencia_internacional" not in columns:
                        conn.execute(text("ALTER TABLE proveedores ADD COLUMN transferencia_internacional BOOLEAN DEFAULT 0"))
                    if "mecanismo_transferencia" not in columns:
                        conn.execute(text("ALTER TABLE proveedores ADD COLUMN mecanismo_transferencia VARCHAR(120) DEFAULT 'Cláusulas Contractuales Tipo (SCC)'"))
                    if "nivel_garantia_pais" not in columns:
                        conn.execute(text("ALTER TABLE proveedores ADD COLUMN nivel_garantia_pais VARCHAR(80) DEFAULT 'Garantías Contractuales Reforzadas'"))
                    conn.commit()
            except Exception as e:
                print(f"[auto_migrate_proveedores] Notice: {e}")

            # Fases Data Protection migrations
            try:
                res = conn.execute(text("PRAGMA table_info(fases)")).fetchall()
                columns = [row[1] for row in res]
                if columns:
                    if "resuelto_externamente" not in columns:
                        conn.execute(text("ALTER TABLE fases ADD COLUMN resuelto_externamente BOOLEAN DEFAULT 0"))
                    if "motivo_resuelto_externo" not in columns:
                        conn.execute(text("ALTER TABLE fases ADD COLUMN motivo_resuelto_externo VARCHAR(200) DEFAULT ''"))
                    conn.commit()
            except Exception as e:
                print(f"[auto_migrate_fases] Notice: {e}")

            # Impact Assessments (EIPD / DPIA) migrations
            try:
                res = conn.execute(text("PRAGMA table_info(impact_assessments)")).fetchall()
                columns = [row[1] for row in res]
                if columns:
                    if "base_licitud" not in columns:
                        conn.execute(text("ALTER TABLE impact_assessments ADD COLUMN base_licitud VARCHAR(120) DEFAULT 'Obligación Legal (Art. 13)'"))
                    if "criterios_alto_riesgo_json" not in columns:
                        conn.execute(text("ALTER TABLE impact_assessments ADD COLUMN criterios_alto_riesgo_json JSON DEFAULT '[]'"))
                    if "dpo_aprobado" not in columns:
                        conn.execute(text("ALTER TABLE impact_assessments ADD COLUMN dpo_aprobado BOOLEAN DEFAULT 1"))
                    if "hash_integridad" not in columns:
                        conn.execute(text("ALTER TABLE impact_assessments ADD COLUMN hash_integridad VARCHAR(100) DEFAULT ''"))
                    if "fecha_evaluacion" not in columns:
                        conn.execute(text("ALTER TABLE impact_assessments ADD COLUMN fecha_evaluacion DATE"))
                    conn.commit()
            except Exception as e:
                print(f"[auto_migrate_impact_assessments] Notice: {e}")


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router, prefix="/api")
    return app


app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    auto_migrate_sqlite()
    db = SessionLocal()
    try:
        seed_initial_data(db)
    except Exception as e:
        print(f"[startup] Seed notice: {e}")
    finally:
        db.close()
