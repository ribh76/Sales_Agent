"""add icp run review status

Revision ID: 0004_icp_run_review_status
Revises: 0003_unique_usernames
Create Date: 2026-07-15 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "0004_icp_run_review_status"
down_revision = "0003_unique_usernames"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "icp_runs",
        sa.Column(
            "review_status",
            sa.String(length=30),
            nullable=False,
            server_default="needs_review",
        ),
    )
    op.create_index("ix_icp_runs_review_status", "icp_runs", ["review_status"])


def downgrade() -> None:
    op.drop_index("ix_icp_runs_review_status", table_name="icp_runs")
    op.drop_column("icp_runs", "review_status")
