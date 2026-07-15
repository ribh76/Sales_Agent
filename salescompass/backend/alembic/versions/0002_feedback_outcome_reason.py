"""add feedback outcome and reason

Revision ID: 0002_feedback_outcome_reason
Revises: 0001_initial
Create Date: 2026-07-14 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_feedback_outcome_reason"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("feedback", sa.Column("outcome", sa.Text(), nullable=True))
    op.add_column("feedback", sa.Column("reason", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("feedback", "reason")
    op.drop_column("feedback", "outcome")
