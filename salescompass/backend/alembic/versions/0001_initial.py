"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-07-13 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

JSONB_TYPE = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def timestamp_columns() -> tuple[sa.Column, sa.Column]:
    return (
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        *timestamp_columns(),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"])

    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("mode", sa.String(length=20), nullable=False),
        sa.Column("industry", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("average_ticket", sa.Float(), nullable=True),
        sa.Column("margin", sa.Float(), nullable=True),
        sa.Column("conversion_rate", sa.Float(), nullable=True),
        sa.Column("average_sales_cycle", sa.Float(), nullable=True),
        sa.Column("past_clients", JSONB_TYPE, nullable=True),
        sa.Column("past_lost_deals", JSONB_TYPE, nullable=True),
        sa.Column("loss_reasons", JSONB_TYPE, nullable=True),
        sa.Column("current_markets", JSONB_TYPE, nullable=True),
        sa.Column("problem_solved", sa.Text(), nullable=True),
        sa.Column("target_user_guess", sa.Text(), nullable=True),
        sa.Column("hypothetical_ticket", sa.Float(), nullable=True),
        sa.Column("known_competitors", JSONB_TYPE, nullable=True),
        sa.Column("early_leads", JSONB_TYPE, nullable=True),
        *timestamp_columns(),
        sa.CheckConstraint("mode IN ('history', 'no_history')", name="ck_companies_mode"),
    )
    op.create_index("ix_companies_user_id", "companies", ["user_id"])
    op.create_index("ix_companies_name", "companies", ["name"])
    op.create_index("ix_companies_mode", "companies", ["mode"])

    op.create_table(
        "icp_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("mode", sa.String(length=20), nullable=False),
        sa.Column("input_snapshot", JSONB_TYPE, nullable=False),
        sa.Column("agent_output", JSONB_TYPE, nullable=False),
        sa.Column("baseline_output", JSONB_TYPE, nullable=False),
        sa.Column("action_plan", JSONB_TYPE, nullable=True),
        sa.Column("refinement_notes", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        *timestamp_columns(),
        sa.CheckConstraint("status IN ('pending', 'completed', 'failed')", name="ck_icp_runs_status"),
        sa.CheckConstraint("mode IN ('history', 'no_history')", name="ck_icp_runs_mode"),
    )
    op.create_index("ix_icp_runs_user_id", "icp_runs", ["user_id"])
    op.create_index("ix_icp_runs_company_id", "icp_runs", ["company_id"])
    op.create_index("ix_icp_runs_status", "icp_runs", ["status"])
    op.create_index("ix_icp_runs_mode", "icp_runs", ["mode"])

    op.create_table(
        "feedback",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("run_id", sa.Integer(), sa.ForeignKey("icp_runs.id"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("confidence", sa.Integer(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_feedback_run_id", "feedback", ["run_id"])

    op.create_table(
        "evaluation_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("mode", sa.String(length=20), nullable=False),
        sa.Column("profile_input", JSONB_TYPE, nullable=False),
        sa.Column("expected_confidence", sa.String(length=20), nullable=False),
        sa.Column("thin_data_case", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "mode IN ('history', 'no_history')",
            name="ck_evaluation_profiles_mode",
        ),
        sa.CheckConstraint(
            "expected_confidence IN ('low', 'medium', 'high')",
            name="ck_evaluation_profiles_expected_confidence",
        ),
    )
    op.create_index("ix_evaluation_profiles_name", "evaluation_profiles", ["name"])
    op.create_index("ix_evaluation_profiles_mode", "evaluation_profiles", ["mode"])

    op.create_table(
        "evaluation_results",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "evaluation_profile_id",
            sa.Integer(),
            sa.ForeignKey("evaluation_profiles.id"),
            nullable=False,
        ),
        sa.Column("baseline_input", JSONB_TYPE, nullable=False),
        sa.Column("agent_output", JSONB_TYPE, nullable=False),
        sa.Column("confidence_pass", sa.Boolean(), nullable=False),
        sa.Column("human_preference", sa.String(length=20), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "human_preference IS NULL OR human_preference IN ('baseline', 'agent', 'tie')",
            name="ck_evaluation_results_human_preference",
        ),
    )
    op.create_index(
        "ix_evaluation_results_evaluation_profile_id",
        "evaluation_results",
        ["evaluation_profile_id"],
    )


def downgrade() -> None:
    op.drop_table("evaluation_results")
    op.drop_table("evaluation_profiles")
    op.drop_table("feedback")
    op.drop_table("icp_runs")
    op.drop_table("companies")
    op.drop_table("users")
