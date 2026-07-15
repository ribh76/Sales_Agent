"""enforce unique usernames

Revision ID: 0003_unique_usernames
Revises: 0002_feedback_outcome_reason
Create Date: 2026-07-15 00:00:00
"""
from alembic import op

revision = "0003_unique_usernames"
down_revision = "0002_feedback_outcome_reason"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_users_username", table_name="users")
    op.create_index("ix_users_username", "users", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_username", table_name="users")
    op.create_index("ix_users_username", "users", ["username"])
