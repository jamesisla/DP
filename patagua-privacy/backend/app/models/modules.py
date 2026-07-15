from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OrganizationMixin:
    organization_id: Mapped[str] = mapped_column(String(80), index=True, nullable=False, default="demo")


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Dpo(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "dpos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(180), nullable=False)
    rut: Mapped[str] = mapped_column(String(30), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    position: Mapped[str] = mapped_column(String(160), nullable=False)
    area: Mapped[str] = mapped_column(String(160), nullable=False)
    dpo_type: Mapped[str] = mapped_column(String(80), nullable=False)
    designated_by: Mapped[str] = mapped_column(String(160), nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class ImplementationProject(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "implementation_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    responsible_area: Mapped[str] = mapped_column(String(160), nullable=False)
    executive_summary: Mapped[str] = mapped_column(Text, nullable=False)
    objective: Mapped[str] = mapped_column(Text, nullable=False)
    scope: Mapped[str] = mapped_column(Text, nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(80), nullable=False)


class TreatmentActivity(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "treatment_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    responsible_or_processor: Mapped[str] = mapped_column(String(180), nullable=False)
    data_categories: Mapped[str] = mapped_column(Text, nullable=False)
    data_subject_universe: Mapped[str] = mapped_column(Text, nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    legal_basis: Mapped[str] = mapped_column(String(180), nullable=False)
    recipients: Mapped[str] = mapped_column(Text, nullable=False)
    international_transfer: Mapped[bool] = mapped_column(Boolean, default=False)
    retention_period: Mapped[str] = mapped_column(String(180), nullable=False)
    data_source: Mapped[str] = mapped_column(String(180), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(80), nullable=False)


class CommitteeMember(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "committee_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    role: Mapped[str] = mapped_column(String(120), nullable=False)
    area: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    is_alternate: Mapped[bool] = mapped_column(Boolean, default=False)


class CommitteeSession(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "committee_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    agenda: Mapped[str] = mapped_column(Text, nullable=False)
    minutes: Mapped[str] = mapped_column(Text, nullable=False)
    agreements: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(80), nullable=False)


class Finding(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(40), nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(80), nullable=False)


class Risk(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "risks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    probability: Mapped[str] = mapped_column(String(80), nullable=False)
    impact: Mapped[str] = mapped_column(String(80), nullable=False)
    priority: Mapped[str] = mapped_column(String(80), nullable=False)
    owner: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[str] = mapped_column(String(80), nullable=False)


class ActionItem(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    source_type: Mapped[str] = mapped_column(String(80), nullable=False)
    source_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    owner: Mapped[str] = mapped_column(String(160), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(80), nullable=False)
    evidence_url: Mapped[str] = mapped_column(String(500), nullable=False, default="")


class Procedure(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "procedures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    type: Mapped[str] = mapped_column(String(120), nullable=False)
    risk_associated: Mapped[str] = mapped_column(String(180), nullable=False)
    responsible_area: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[str] = mapped_column(String(80), nullable=False)
    version: Mapped[str] = mapped_column(String(40), nullable=False)


class Ticket(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String(120), nullable=False)
    requester_name: Mapped[str] = mapped_column(String(180), nullable=False)
    requester_email: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(80), nullable=False)
    assigned_to: Mapped[str] = mapped_column(String(160), nullable=False)


class Consent(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "consents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    holder_identifier: Mapped[str] = mapped_column(String(120), nullable=False)
    holder_email: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    policy_version: Mapped[str] = mapped_column(String(40), nullable=False)
    consent_text: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(String(120), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(80), nullable=False)
    user_agent: Mapped[str] = mapped_column(String(300), nullable=False)
    granted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(80), nullable=False)


class Policy(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "policies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    version: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(80), nullable=False)
    approved_by: Mapped[str] = mapped_column(String(160), nullable=False)
    approved_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)


class DataMappingEntry(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "data_mapping_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    area: Mapped[str] = mapped_column(String(160), nullable=False)
    system_name: Mapped[str] = mapped_column(String(180), nullable=False)
    database_name: Mapped[str] = mapped_column(String(180), nullable=False, default="")
    table_name: Mapped[str] = mapped_column(String(180), nullable=False, default="")
    field_name: Mapped[str] = mapped_column(String(180), nullable=False)
    data_category: Mapped[str] = mapped_column(String(180), nullable=False)
    data_subject_universe: Mapped[str] = mapped_column(Text, nullable=False)
    is_sensitive: Mapped[bool] = mapped_column(Boolean, default=False)
    is_part_of_database: Mapped[bool] = mapped_column(Boolean, default=True)
    database_category: Mapped[str] = mapped_column(String(180), nullable=False, default="")
    treatment_purpose: Mapped[str] = mapped_column(Text, nullable=False)
    legal_basis: Mapped[str] = mapped_column(String(180), nullable=False)
    data_source: Mapped[str] = mapped_column(String(180), nullable=False)
    international_transfer: Mapped[bool] = mapped_column(Boolean, default=False)
    third_party_communication: Mapped[bool] = mapped_column(Boolean, default=False)
    internal_responsible: Mapped[str] = mapped_column(String(180), nullable=False)
    retention_period: Mapped[str] = mapped_column(String(180), nullable=False)
    associated_platforms: Mapped[str] = mapped_column(Text, nullable=False, default="")
    access_roles: Mapped[str] = mapped_column(Text, nullable=False, default="")
    storage_location: Mapped[str] = mapped_column(String(180), nullable=False, default="")
    automated_decisions: Mapped[bool] = mapped_column(Boolean, default=False)
    profiling: Mapped[bool] = mapped_column(Boolean, default=False)
    associated_risks: Mapped[str] = mapped_column(Text, nullable=False, default="")
    comments: Mapped[str] = mapped_column(Text, nullable=False, default="")
    area_manager_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    area_manager_observations: Mapped[str] = mapped_column(Text, nullable=False, default="")
    validation_status: Mapped[str] = mapped_column(String(80), nullable=False, default="pendiente")


class ProcessingActivity(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "processing_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    activity_name: Mapped[str] = mapped_column(String(180), nullable=False)
    responsible_or_processor: Mapped[str] = mapped_column(String(180), nullable=False)
    data_categories: Mapped[str] = mapped_column(Text, nullable=False)
    data_subject_universe: Mapped[str] = mapped_column(Text, nullable=False)
    treatment_purpose: Mapped[str] = mapped_column(Text, nullable=False)
    legal_basis: Mapped[str] = mapped_column(String(180), nullable=False)
    legitimate_interest_detail: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recipients: Mapped[str] = mapped_column(Text, nullable=False, default="")
    international_transfer: Mapped[bool] = mapped_column(Boolean, default=False)
    international_transfer_country: Mapped[str] = mapped_column(String(180), nullable=False, default="")
    international_transfer_guarantees: Mapped[str] = mapped_column(Text, nullable=False, default="")
    retention_period: Mapped[str] = mapped_column(String(180), nullable=False)
    data_source: Mapped[str] = mapped_column(String(180), nullable=False)
    public_source: Mapped[bool] = mapped_column(Boolean, default=False)
    security_measures_reference: Mapped[str] = mapped_column(Text, nullable=False, default="")
    automated_decisions: Mapped[bool] = mapped_column(Boolean, default=False)
    profiling: Mapped[bool] = mapped_column(Boolean, default=False)
    profiling_logic: Mapped[str] = mapped_column(Text, nullable=False, default="")
    expected_consequences: Mapped[str] = mapped_column(Text, nullable=False, default="")
    source_mapping_entries: Mapped[str] = mapped_column(Text, nullable=False, default="")
    publication_status: Mapped[str] = mapped_column(String(80), nullable=False, default="borrador")
    risk_level: Mapped[str] = mapped_column(String(40), nullable=False, default="Medio")
    status: Mapped[str] = mapped_column(String(80), nullable=False, default="Activo")


class FindingsReport(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "findings_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    version: Mapped[str] = mapped_column(String(40), nullable=False, default="1.0")
    status: Mapped[str] = mapped_column(String(80), nullable=False, default="borrador")
    executive_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    main_conclusions: Mapped[str] = mapped_column(Text, nullable=False, default="")
    main_risks_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    compliance_gaps_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    article_14ter_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    global_risk_level: Mapped[str] = mapped_column(String(40), nullable=False, default="Medio")
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[str] = mapped_column(String(180), nullable=False, default="")
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ReportSection(Base):
    __tablename__ = "report_sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    report_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    section_type: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Article14TerChecklistItem(Base, OrganizationMixin, TimestampMixin):
    __tablename__ = "article_14ter_checklist_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(40), nullable=False)
    requirement: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(80), nullable=False, default="no_cumple")
    evidence: Mapped[str] = mapped_column(Text, nullable=False, default="")
    gap_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recommendation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    responsible_area: Mapped[str] = mapped_column(String(180), nullable=False, default="")
    priority: Mapped[str] = mapped_column(String(80), nullable=False, default="Media")
