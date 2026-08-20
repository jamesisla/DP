from datetime import datetime, date
from sqlalchemy import Boolean, DateTime, Date, ForeignKey, Integer, String, Text, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Area(Base, TimestampMixin):
    __tablename__ = "areas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, default="")
    responsable_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", use_alter=True, name="fk_area_responsable"), nullable=True)

    responsable: Mapped["User"] = relationship("User", foreign_keys=[responsable_id], post_update=True)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    role: Mapped[str] = mapped_column(String(80), default="dpo")  # Jefe de Servicio, Encargado/a Responsable, Comité Ejecutivo, Responsable de Área, Invitado/Colaborador
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id", name="fk_user_area"), nullable=True)
    clave_unica_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rut: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cargo: Mapped[str | None] = mapped_column(String(160), nullable=True)

    area: Mapped[Area | None] = relationship("Area", foreign_keys=[area_id])


class ImplementationProject(Base, TimestampMixin):
    __tablename__ = "implementation_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    stage: Mapped[str] = mapped_column(String(80), default="Diagnostico")
    progress: Mapped[int] = mapped_column(Integer, default=12)
    owner: Mapped[str] = mapped_column(String(160), default="DPO")
    summary: Mapped[str] = mapped_column(Text, default="")
    
    fecha_inicio: Mapped[date] = mapped_column(Date, default=date(2025, 12, 1))
    fecha_fin: Mapped[date] = mapped_column(Date, default=date(2026, 12, 1))
    estado: Mapped[str] = mapped_column(String(80), default="Activo")

    fases: Mapped[list["Fase"]] = relationship("Fase", back_populates="proyecto", cascade="all, delete-orphan")


class Fase(Base, TimestampMixin):
    __tablename__ = "fases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(180), nullable=False)
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_inicio_plan: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin_plan: Mapped[date] = mapped_column(Date, nullable=False)
    ponderacion: Mapped[int] = mapped_column(Integer, default=10)
    proyecto_id: Mapped[int] = mapped_column(ForeignKey("implementation_projects.id", ondelete="CASCADE"), nullable=False)

    proyecto: Mapped[ImplementationProject] = relationship("ImplementationProject", back_populates="fases")
    tareas: Mapped[list["Tarea"]] = relationship("Tarea", back_populates="fase", cascade="all, delete-orphan")


class Tarea(Base, TimestampMixin):
    __tablename__ = "tareas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(180), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, default="")
    fase_id: Mapped[int] = mapped_column(ForeignKey("fases.id", ondelete="CASCADE"), nullable=False)
    area_responsable_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id"), nullable=True)
    usuario_asignado_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    estado: Mapped[str] = mapped_column(String(80), default="Pendiente")  # Pendiente, En progreso, Completada, Atrasada
    dependencia_de: Mapped[int | None] = mapped_column(ForeignKey("tareas.id"), nullable=True)

    fase: Mapped[Fase] = relationship("Fase", back_populates="tareas")
    area_responsable: Mapped[Area | None] = relationship("Area")
    usuario_asignado: Mapped[User | None] = relationship("User")


class MatrizLevantamiento(Base, TimestampMixin):
    __tablename__ = "matrices_levantamiento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id"), nullable=False)
    datos_json: Mapped[dict | list] = mapped_column(JSON, default=list)  # 14 fields per treatment
    completada: Mapped[bool] = mapped_column(Boolean, default=False)

    area: Mapped[Area] = relationship("Area")


class Riesgo(Base, TimestampMixin):
    __tablename__ = "riesgos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    matriz_id: Mapped[int | None] = mapped_column(ForeignKey("matrices_levantamiento.id"), nullable=True)
    nivel: Mapped[str] = mapped_column(String(40), default="Medio")  # Bajo, Medio, Alto, Crítico
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    puntuacion: Mapped[int] = mapped_column(Integer, default=5)  # 1 to 25
    probabilidad: Mapped[int] = mapped_column(Integer, default=2)  # 1 to 5
    impacto: Mapped[int] = mapped_column(Integer, default=3)  # 1 to 5
    requiere_eipd: Mapped[bool] = mapped_column(Boolean, default=False)

    matriz: Mapped[MatrizLevantamiento | None] = relationship("MatrizLevantamiento")


class Documento(Base, TimestampMixin):
    __tablename__ = "documentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tipo: Mapped[str] = mapped_column(String(80), nullable=False)  # catalogo, politica, protocolo, anexo
    contenido: Mapped[str] = mapped_column(Text, default="")
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    estado: Mapped[str] = mapped_column(String(80), default="borrador")  # borrador, revision, aprobado, firmado

    comentarios: Mapped[list["Comentario"]] = relationship("Comentario", back_populates="documento", cascade="all, delete-orphan")


class Comentario(Base, TimestampMixin):
    __tablename__ = "comentarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    documento_id: Mapped[int] = mapped_column(ForeignKey("documentos.id", ondelete="CASCADE"), nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("comentarios.id"), nullable=True)

    documento: Mapped[Documento] = relationship("Documento", back_populates="comentarios")
    usuario: Mapped[User] = relationship("User")


class FlujoAprobacion(Base, TimestampMixin):
    __tablename__ = "flujos_aprobacion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    documento_id: Mapped[int] = mapped_column(ForeignKey("documentos.id", ondelete="CASCADE"), nullable=False)
    estado_actual: Mapped[str] = mapped_column(String(80), nullable=False)
    usuario_origen_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    usuario_destino_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    documento: Mapped[Documento] = relationship("Documento")
    usuario_origen: Mapped[User | None] = relationship("User", foreign_keys=[usuario_origen_id])
    usuario_destino: Mapped[User | None] = relationship("User", foreign_keys=[usuario_destino_id])


class Proveedor(Base, TimestampMixin):
    __tablename__ = "proveedores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(180), nullable=False)
    rut: Mapped[str] = mapped_column(String(20), nullable=False)
    servicio: Mapped[str] = mapped_column(String(255), nullable=False)
    fecha_contrato_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_contrato_fin: Mapped[date] = mapped_column(Date, nullable=False)
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id"), nullable=True)

    area: Mapped[Area | None] = relationship("Area")


class LogAuditoria(Base, TimestampMixin):
    __tablename__ = "logs_auditoria"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    accion: Mapped[str] = mapped_column(String(180), nullable=False)
    entidad_afectada: Mapped[str] = mapped_column(String(120), nullable=False)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    detalle_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)

    usuario: Mapped[User | None] = relationship("User")


# Ley 21.719 Specialized Modules

class ArcoRequest(Base, TimestampMixin):
    __tablename__ = "arco_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    folio: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    tipo_derecho: Mapped[str] = mapped_column(String(50), nullable=False)  # Acceso, Rectificación, Cancelación, Oposición, Portabilidad, Bloqueo
    titular_nombre: Mapped[str] = mapped_column(String(180), nullable=False)
    titular_rut: Mapped[str] = mapped_column(String(20), nullable=False)
    titular_email: Mapped[str] = mapped_column(String(255), nullable=False)
    fecha_ingreso: Mapped[date] = mapped_column(Date, default=date.today)
    dias_habiles_limite: Mapped[int] = mapped_column(Integer, default=15)  # 15 business days legal limit
    fecha_limite_legal: Mapped[date] = mapped_column(Date, nullable=False)
    estado: Mapped[str] = mapped_column(String(80), default="Ingresada")  # Ingresada, En análisis, Respondida favorable, Rechazada fundada, Prorrogada
    descripcion_solicitud: Mapped[str] = mapped_column(Text, nullable=False)
    fundamento_respuesta: Mapped[str] = mapped_column(Text, default="")
    area_derivada_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id"), nullable=True)
    responsable_asignado_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    area_derivada: Mapped[Area | None] = relationship("Area")
    responsable_asignado: Mapped[User | None] = relationship("User")


class SecurityBreach(Base, TimestampMixin):
    __tablename__ = "security_breaches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    codigo_incidente: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    fecha_deteccion: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    fecha_limite_notificacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)  # 72 hours limit
    tipo_incidente: Mapped[str] = mapped_column(String(100), nullable=False)  # Acceso no autorizado, Exfiltración, Ransomware, Extravío físico
    gravedad: Mapped[str] = mapped_column(String(40), default="Alta")  # Baja, Media, Alta, Crítica
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    datos_afectados: Mapped[str] = mapped_column(Text, nullable=False)
    cantidad_titulares_afectados: Mapped[int] = mapped_column(Integer, default=0)
    medidas_contencion: Mapped[str] = mapped_column(Text, default="")
    notificado_agencia: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_notificacion_agencia: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notificado_titulares: Mapped[bool] = mapped_column(Boolean, default=False)
    estado: Mapped[str] = mapped_column(String(80), default="En contención")  # En contención, En investigación, Notificado a Agencia, Mitigado y Cerrado
    reportado_por_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    reportado_por: Mapped[User | None] = relationship("User")


class ImpactAssessment(Base, TimestampMixin):
    __tablename__ = "impact_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id"), nullable=False)
    proceso_relacionado: Mapped[str] = mapped_column(String(180), nullable=False)
    motivo_alto_riesgo: Mapped[str] = mapped_column(Text, nullable=False)
    analisis_necesidad: Mapped[str] = mapped_column(Text, default="")
    riesgos_derechos: Mapped[str] = mapped_column(Text, default="")
    medidas_mitigacion: Mapped[str] = mapped_column(Text, default="")
    riesgo_residual: Mapped[str] = mapped_column(String(40), default="Aceptable")
    opinion_dpo: Mapped[str] = mapped_column(Text, default="")
    estado: Mapped[str] = mapped_column(String(80), default="Borrador")  # Borrador, En revisión DPO, Aprobada, Observada

    area: Mapped[Area] = relationship("Area")


# Backward Compatibility Tables
class TreatmentActivity(Base, TimestampMixin):
    __tablename__ = "treatment_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    area: Mapped[str] = mapped_column(String(120), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    legal_basis: Mapped[str] = mapped_column(String(160), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(40), default="Medio")


class Finding(Base, TimestampMixin):
    __tablename__ = "findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    severity: Mapped[str] = mapped_column(String(40), default="Media")
    status: Mapped[str] = mapped_column(String(80), default="Abierto")
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)


class Consent(Base, TimestampMixin):
    __tablename__ = "consents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    data_subject: Mapped[str] = mapped_column(String(180), nullable=False)
    channel: Mapped[str] = mapped_column(String(100), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(80), default="Vigente")


class CaseTicket(Base, TimestampMixin):
    __tablename__ = "case_tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject: Mapped[str] = mapped_column(String(180), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(80), default="Nuevo")
    assigned_to_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    assigned_to: Mapped[User | None] = relationship("User", foreign_keys=[assigned_to_id])
