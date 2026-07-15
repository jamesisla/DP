"""create matrix and processing catalog tables

Revision ID: 20260623_0001
Revises:
Create Date: 2026-06-23
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260623_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "data_mapping_entries",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("organization_id", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("area", sa.String(length=160), nullable=False),
        sa.Column("system_name", sa.String(length=180), nullable=False),
        sa.Column("database_name", sa.String(length=180), nullable=False, server_default=""),
        sa.Column("table_name", sa.String(length=180), nullable=False, server_default=""),
        sa.Column("field_name", sa.String(length=180), nullable=False),
        sa.Column("data_category", sa.String(length=180), nullable=False),
        sa.Column("data_subject_universe", sa.Text(), nullable=False),
        sa.Column("is_sensitive", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_part_of_database", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("database_category", sa.String(length=180), nullable=False, server_default=""),
        sa.Column("treatment_purpose", sa.Text(), nullable=False),
        sa.Column("legal_basis", sa.String(length=180), nullable=False),
        sa.Column("data_source", sa.String(length=180), nullable=False),
        sa.Column("international_transfer", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("third_party_communication", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("internal_responsible", sa.String(length=180), nullable=False),
        sa.Column("retention_period", sa.String(length=180), nullable=False),
        sa.Column("associated_platforms", sa.Text(), nullable=False, server_default=""),
        sa.Column("access_roles", sa.Text(), nullable=False, server_default=""),
        sa.Column("storage_location", sa.String(length=180), nullable=False, server_default=""),
        sa.Column("automated_decisions", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("profiling", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("associated_risks", sa.Text(), nullable=False, server_default=""),
        sa.Column("comments", sa.Text(), nullable=False, server_default=""),
        sa.Column("area_manager_approval", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("area_manager_observations", sa.Text(), nullable=False, server_default=""),
        sa.Column("validation_status", sa.String(length=80), nullable=False, server_default="pendiente"),
    )
    op.create_index("ix_data_mapping_entries_organization_id", "data_mapping_entries", ["organization_id"])

    op.create_table(
        "processing_activities",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("organization_id", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("activity_name", sa.String(length=180), nullable=False),
        sa.Column("responsible_or_processor", sa.String(length=180), nullable=False),
        sa.Column("data_categories", sa.Text(), nullable=False),
        sa.Column("data_subject_universe", sa.Text(), nullable=False),
        sa.Column("treatment_purpose", sa.Text(), nullable=False),
        sa.Column("legal_basis", sa.String(length=180), nullable=False),
        sa.Column("legitimate_interest_detail", sa.Text(), nullable=False, server_default=""),
        sa.Column("recipients", sa.Text(), nullable=False, server_default=""),
        sa.Column("international_transfer", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("international_transfer_country", sa.String(length=180), nullable=False, server_default=""),
        sa.Column("international_transfer_guarantees", sa.Text(), nullable=False, server_default=""),
        sa.Column("retention_period", sa.String(length=180), nullable=False),
        sa.Column("data_source", sa.String(length=180), nullable=False),
        sa.Column("public_source", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("security_measures_reference", sa.Text(), nullable=False, server_default=""),
        sa.Column("automated_decisions", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("profiling", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("profiling_logic", sa.Text(), nullable=False, server_default=""),
        sa.Column("expected_consequences", sa.Text(), nullable=False, server_default=""),
        sa.Column("source_mapping_entries", sa.Text(), nullable=False, server_default=""),
        sa.Column("publication_status", sa.String(length=80), nullable=False, server_default="borrador"),
        sa.Column("risk_level", sa.String(length=40), nullable=False, server_default="Medio"),
        sa.Column("status", sa.String(length=80), nullable=False, server_default="Activo"),
    )
    op.create_index("ix_processing_activities_organization_id", "processing_activities", ["organization_id"])


def downgrade() -> None:
    op.drop_index("ix_processing_activities_organization_id", table_name="processing_activities")
    op.drop_table("processing_activities")
    op.drop_index("ix_data_mapping_entries_organization_id", table_name="data_mapping_entries")
    op.drop_table("data_mapping_entries")
