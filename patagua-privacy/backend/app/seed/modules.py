from datetime import date, datetime, timezone
from typing import Any, Type

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.modules import (
    ActionItem,
    CommitteeMember,
    CommitteeSession,
    Consent,
    DataMappingEntry,
    Dpo,
    Finding,
    ImplementationProject,
    Policy,
    ProcessingActivity,
    Procedure,
    Risk,
    Ticket,
    TreatmentActivity,
)

ORG = settings.default_organization_id


def seed_if_empty(db: Session, model: Type[Any], rows: list[dict[str, Any]]) -> None:
    exists = db.query(model).filter(model.organization_id == ORG).first()
    if exists:
        return

    db.add_all([model(**row, organization_id=ORG) for row in rows])
    db.commit()


def seed_module_data(db: Session) -> None:
    seed_if_empty(
        db,
        Dpo,
        [
            {
                "full_name": "Administrador Patagua",
                "rut": "12.345.678-9",
                "email": "admin@patagua.cl",
                "phone": "+56 9 1234 5678",
                "position": "Data Protection Officer",
                "area": "Legal y Cumplimiento",
                "dpo_type": "Interno",
                "designated_by": "Gerencia General",
                "start_date": date(2026, 6, 1),
                "active": True,
            }
        ],
    )
    seed_if_empty(
        db,
        ImplementationProject,
        [
            {
                "name": "Implementacion Ley 21.719",
                "responsible_area": "Legal y Cumplimiento",
                "executive_summary": "Programa inicial para levantar actividades, riesgos y controles.",
                "objective": "Implementar capacidades basicas de cumplimiento de proteccion de datos.",
                "scope": "Areas de Personas, Comercial, Operaciones y Soporte.",
                "start_date": date(2026, 6, 1),
                "end_date": date(2026, 9, 30),
                "status": "En progreso",
            }
        ],
    )
    seed_if_empty(
        db,
        TreatmentActivity,
        [
            {
                "name": "Gestion de colaboradores",
                "responsible_or_processor": "Personas",
                "data_categories": "Identificacion, contacto, remuneraciones, salud laboral",
                "data_subject_universe": "Colaboradores y prestadores",
                "purpose": "Administrar relacion laboral y beneficios.",
                "legal_basis": "Ejecucion contractual",
                "recipients": "Previred, bancos, mutualidad",
                "international_transfer": False,
                "retention_period": "5 anos desde termino contractual",
                "data_source": "Titular y sistemas internos",
                "risk_level": "Medio",
                "status": "En revision",
            }
        ],
    )
    seed_if_empty(
        db,
        CommitteeMember,
        [
            {"name": "Mariana Silva", "role": "Presidenta", "area": "Gerencia General", "email": "mariana@empresa.cl", "is_alternate": False},
            {"name": "Rodrigo Perez", "role": "Miembro", "area": "Legal", "email": "rodrigo@empresa.cl", "is_alternate": False},
        ],
    )
    seed_if_empty(
        db,
        CommitteeSession,
        [
            {
                "session_date": date(2026, 6, 28),
                "agenda": "Revision avance matriz, riesgos altos y politica de tratamiento.",
                "minutes": "Sesion programada con foco en decisiones ejecutivas.",
                "agreements": "Validar politica y priorizar controles criticos.",
                "status": "Programada",
            }
        ],
    )
    seed_if_empty(
        db,
        Finding,
        [
            {
                "title": "Registro de actividades incompleto",
                "description": "Faltan tratamientos de areas comerciales y soporte.",
                "category": "Inventario",
                "risk_level": "Alto",
                "recommendation": "Completar levantamiento y validar bases de licitud.",
                "status": "Abierto",
            }
        ],
    )
    seed_if_empty(
        db,
        Risk,
        [
            {
                "title": "Datos sensibles sin control reforzado",
                "description": "Se identifican datos sensibles en procesos de personas sin controles documentados.",
                "probability": "Media",
                "impact": "Alto",
                "priority": "Alta",
                "owner": "Personas",
                "status": "Abierto",
            }
        ],
    )
    seed_if_empty(
        db,
        ActionItem,
        [
            {
                "title": "Completar matriz de Personas",
                "description": "Levantar finalidades, bases de licitud y periodos de retencion.",
                "source_type": "Hallazgo",
                "source_id": 1,
                "owner": "DPO",
                "due_date": date(2026, 6, 30),
                "status": "Pendiente",
                "evidence_url": "",
            }
        ],
    )
    seed_if_empty(
        db,
        Procedure,
        [
            {
                "name": "Atencion de derechos de titulares",
                "type": "Derechos ARCO",
                "risk_associated": "Incumplimiento de plazos",
                "responsible_area": "Legal",
                "status": "En progreso",
                "version": "0.1",
            }
        ],
    )
    seed_if_empty(
        db,
        Ticket,
        [
            {
                "type": "Derechos titulares",
                "requester_name": "Cliente Demo",
                "requester_email": "cliente@example.com",
                "subject": "Solicitud de acceso",
                "description": "Titular solicita copia de sus datos personales.",
                "priority": "Alta",
                "status": "Abierto",
                "assigned_to": "DPO",
            }
        ],
    )
    seed_if_empty(
        db,
        Consent,
        [
            {
                "holder_identifier": "11111111-1",
                "holder_email": "titular@example.com",
                "purpose": "Envio de comunicaciones comerciales",
                "policy_version": "1.0",
                "consent_text": "Acepto el tratamiento de mis datos para comunicaciones comerciales.",
                "channel": "Formulario web",
                "ip_address": "127.0.0.1",
                "user_agent": "Seed",
                "granted_at": datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc),
                "revoked_at": None,
                "status": "Vigente",
            }
        ],
    )
    seed_if_empty(
        db,
        DataMappingEntry,
        [
            {
                "area": "Personas",
                "system_name": "ERP Personas",
                "database_name": "hr_prod",
                "table_name": "employees",
                "field_name": "health_condition",
                "data_category": "Salud",
                "data_subject_universe": "Colaboradores",
                "is_sensitive": True,
                "is_part_of_database": True,
                "database_category": "Operacional",
                "treatment_purpose": "Gestion laboral y beneficios",
                "legal_basis": "Ejecucion contractual",
                "data_source": "Titular",
                "international_transfer": False,
                "third_party_communication": True,
                "internal_responsible": "Personas",
                "retention_period": "5 anos",
                "associated_platforms": "ERP Personas, Portal Beneficios",
                "access_roles": "RRHH, Legal",
                "storage_location": "Chile",
                "automated_decisions": False,
                "profiling": False,
                "associated_risks": "Tratamiento de dato sensible",
                "comments": "Requiere control reforzado.",
                "area_manager_approval": True,
                "area_manager_observations": "Validado por jefatura.",
                "validation_status": "validado",
            },
            {
                "area": "Comercial",
                "system_name": "CRM",
                "database_name": "crm",
                "table_name": "contacts",
                "field_name": "email",
                "data_category": "Contacto",
                "data_subject_universe": "Prospectos y clientes",
                "is_sensitive": False,
                "is_part_of_database": True,
                "database_category": "Comercial",
                "treatment_purpose": "Gestion comercial y comunicaciones",
                "legal_basis": "Consentimiento",
                "data_source": "Formulario web",
                "international_transfer": True,
                "third_party_communication": True,
                "internal_responsible": "Comercial",
                "retention_period": "2 anos",
                "associated_platforms": "CRM, Email marketing",
                "access_roles": "Ventas, Marketing",
                "storage_location": "Cloud",
                "automated_decisions": False,
                "profiling": True,
                "associated_risks": "Transferencia internacional",
                "comments": "Verificar garantias contractuales.",
                "area_manager_approval": False,
                "area_manager_observations": "",
                "validation_status": "en_revision",
            },
        ],
    )
    seed_if_empty(
        db,
        ProcessingActivity,
        [
            {
                "activity_name": "Gestion laboral y beneficios",
                "responsible_or_processor": "Personas",
                "data_categories": "Salud, identificacion, contacto",
                "data_subject_universe": "Colaboradores",
                "treatment_purpose": "Gestion laboral y beneficios",
                "legal_basis": "Ejecucion contractual",
                "legitimate_interest_detail": "",
                "recipients": "Mutualidad, bancos, proveedores de beneficios",
                "international_transfer": False,
                "international_transfer_country": "",
                "international_transfer_guarantees": "",
                "retention_period": "5 anos",
                "data_source": "Titular",
                "public_source": False,
                "security_measures_reference": "Control de acceso por rol",
                "automated_decisions": False,
                "profiling": False,
                "profiling_logic": "",
                "expected_consequences": "",
                "source_mapping_entries": "1",
                "publication_status": "borrador",
                "risk_level": "Alto",
                "status": "Activo",
            }
        ],
    )
    seed_if_empty(
        db,
        Policy,
        [
            {
                "title": "Politica de tratamiento de datos personales",
                "version": "0.9",
                "status": "En revision",
                "approved_by": "Comite Ejecutivo",
                "approved_at": None,
                "content": "Documento base de politica de tratamiento para revision ejecutiva.",
            }
        ],
    )
