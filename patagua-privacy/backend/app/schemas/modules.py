from datetime import date, datetime
from typing import TypeAlias

from pydantic import BaseModel, ConfigDict, EmailStr


class RecordReadMixin(BaseModel):
    id: int
    organization_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DpoBase(BaseModel):
    full_name: str
    rut: str
    email: EmailStr
    phone: str
    position: str
    area: str
    dpo_type: str
    designated_by: str
    start_date: date | None = None
    active: bool = True


class DpoCreate(DpoBase):
    pass


class DpoUpdate(BaseModel):
    full_name: str | None = None
    rut: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    position: str | None = None
    area: str | None = None
    dpo_type: str | None = None
    designated_by: str | None = None
    start_date: date | None = None
    active: bool | None = None


class DpoRead(DpoBase, RecordReadMixin):
    pass


class ProjectBase(BaseModel):
    name: str
    responsible_area: str
    executive_summary: str
    objective: str
    scope: str
    start_date: date | None = None
    end_date: date | None = None
    status: str


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    responsible_area: str | None = None
    executive_summary: str | None = None
    objective: str | None = None
    scope: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None


class ProjectRead(ProjectBase, RecordReadMixin):
    pass


class TreatmentActivityBase(BaseModel):
    name: str
    responsible_or_processor: str
    data_categories: str
    data_subject_universe: str
    purpose: str
    legal_basis: str
    recipients: str
    international_transfer: bool = False
    retention_period: str
    data_source: str
    risk_level: str
    status: str


class TreatmentActivityCreate(TreatmentActivityBase):
    pass


class TreatmentActivityUpdate(BaseModel):
    name: str | None = None
    responsible_or_processor: str | None = None
    data_categories: str | None = None
    data_subject_universe: str | None = None
    purpose: str | None = None
    legal_basis: str | None = None
    recipients: str | None = None
    international_transfer: bool | None = None
    retention_period: str | None = None
    data_source: str | None = None
    risk_level: str | None = None
    status: str | None = None


class TreatmentActivityRead(TreatmentActivityBase, RecordReadMixin):
    pass


class CommitteeMemberBase(BaseModel):
    name: str
    role: str
    area: str
    email: EmailStr
    is_alternate: bool = False


class CommitteeMemberCreate(CommitteeMemberBase):
    pass


class CommitteeMemberUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    area: str | None = None
    email: EmailStr | None = None
    is_alternate: bool | None = None


class CommitteeMemberRead(CommitteeMemberBase, RecordReadMixin):
    pass


class CommitteeSessionBase(BaseModel):
    session_date: date | None = None
    agenda: str
    minutes: str
    agreements: str
    status: str


class CommitteeSessionCreate(CommitteeSessionBase):
    pass


class CommitteeSessionUpdate(BaseModel):
    session_date: date | None = None
    agenda: str | None = None
    minutes: str | None = None
    agreements: str | None = None
    status: str | None = None


class CommitteeSessionRead(CommitteeSessionBase, RecordReadMixin):
    pass


class FindingBase(BaseModel):
    title: str
    description: str
    category: str
    risk_level: str
    recommendation: str
    status: str


class FindingCreate(FindingBase):
    pass


class FindingUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    risk_level: str | None = None
    recommendation: str | None = None
    status: str | None = None


class FindingRead(FindingBase, RecordReadMixin):
    pass


class RiskBase(BaseModel):
    title: str
    description: str
    probability: str
    impact: str
    priority: str
    owner: str
    status: str


class RiskCreate(RiskBase):
    pass


class RiskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    probability: str | None = None
    impact: str | None = None
    priority: str | None = None
    owner: str | None = None
    status: str | None = None


class RiskRead(RiskBase, RecordReadMixin):
    pass


class ActionBase(BaseModel):
    title: str
    description: str
    source_type: str
    source_id: int | None = None
    owner: str
    due_date: date | None = None
    status: str
    evidence_url: str = ""


class ActionCreate(ActionBase):
    pass


class ActionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    source_type: str | None = None
    source_id: int | None = None
    owner: str | None = None
    due_date: date | None = None
    status: str | None = None
    evidence_url: str | None = None


class ActionRead(ActionBase, RecordReadMixin):
    pass


class ProcedureBase(BaseModel):
    name: str
    type: str
    risk_associated: str
    responsible_area: str
    status: str
    version: str


class ProcedureCreate(ProcedureBase):
    pass


class ProcedureUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    risk_associated: str | None = None
    responsible_area: str | None = None
    status: str | None = None
    version: str | None = None


class ProcedureRead(ProcedureBase, RecordReadMixin):
    pass


class TicketBase(BaseModel):
    type: str
    requester_name: str
    requester_email: EmailStr
    subject: str
    description: str
    priority: str
    status: str
    assigned_to: str


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    type: str | None = None
    requester_name: str | None = None
    requester_email: EmailStr | None = None
    subject: str | None = None
    description: str | None = None
    priority: str | None = None
    status: str | None = None
    assigned_to: str | None = None


class TicketRead(TicketBase, RecordReadMixin):
    pass


class ConsentBase(BaseModel):
    holder_identifier: str
    holder_email: EmailStr
    purpose: str
    policy_version: str
    consent_text: str
    channel: str
    ip_address: str
    user_agent: str
    granted_at: datetime | None = None
    revoked_at: datetime | None = None
    status: str


class ConsentCreate(ConsentBase):
    pass


class ConsentUpdate(BaseModel):
    holder_identifier: str | None = None
    holder_email: EmailStr | None = None
    purpose: str | None = None
    policy_version: str | None = None
    consent_text: str | None = None
    channel: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    granted_at: datetime | None = None
    revoked_at: datetime | None = None
    status: str | None = None


class ConsentRead(ConsentBase, RecordReadMixin):
    pass


class PolicyBase(BaseModel):
    title: str
    version: str
    status: str
    approved_by: str
    approved_at: date | None = None
    content: str


class PolicyCreate(PolicyBase):
    pass


class PolicyUpdate(BaseModel):
    title: str | None = None
    version: str | None = None
    status: str | None = None
    approved_by: str | None = None
    approved_at: date | None = None
    content: str | None = None


class PolicyRead(PolicyBase, RecordReadMixin):
    pass


CreateSchema: TypeAlias = (
    DpoCreate
    | ProjectCreate
    | TreatmentActivityCreate
    | CommitteeMemberCreate
    | CommitteeSessionCreate
    | FindingCreate
    | RiskCreate
    | ActionCreate
    | ProcedureCreate
    | TicketCreate
    | ConsentCreate
    | PolicyCreate
)
