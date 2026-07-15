"""create reports and article 14 ter checklist

Revision ID: 20260623_0002
Revises: 20260623_0001
Create Date: 2026-06-23
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260623_0002"
down_revision: Union[str, None] = "20260623_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "findings_reports",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("organization_id", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("version", sa.String(length=40), nullable=False, server_default="1.0"),
        sa.Column("status", sa.String(length=80), nullable=False, server_default="borrador"),
        sa.Column("executive_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("main_conclusions", sa.Text(), nullable=False, server_default=""),
        sa.Column("main_risks_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("compliance_gaps_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("article_14ter_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("global_risk_level", sa.String(length=40), nullable=False, server_default="Medio"),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_by", sa.String(length=180), nullable=False, server_default=""),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_findings_reports_organization_id", "findings_reports", ["organization_id"])

    op.create_table(
        "report_sections",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("report_id", sa.Integer(), nullable=False),
        sa.Column("section_type", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_report_sections_report_id", "report_sections", ["report_id"])

    op.create_table(
        "article_14ter_checklist_items",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("organization_id", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("requirement", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=80), nullable=False, server_default="no_cumple"),
        sa.Column("evidence", sa.Text(), nullable=False, server_default=""),
        sa.Column("gap_description", sa.Text(), nullable=False, server_default=""),
        sa.Column("recommendation", sa.Text(), nullable=False, server_default=""),
        sa.Column("responsible_area", sa.String(length=180), nullable=False, server_default=""),
        sa.Column("priority", sa.String(length=80), nullable=False, server_default="Media"),
    )
    op.create_index("ix_article_14ter_checklist_items_organization_id", "article_14ter_checklist_items", ["organization_id"])


def downgrade() -> None:
    op.drop_index("ix_article_14ter_checklist_items_organization_id", table_name="article_14ter_checklist_items")
    op.drop_table("article_14ter_checklist_items")
    op.drop_index("ix_report_sections_report_id", table_name="report_sections")
    op.drop_table("report_sections")
    op.drop_index("ix_findings_reports_organization_id", table_name="findings_reports")
    op.drop_table("findings_reports")
