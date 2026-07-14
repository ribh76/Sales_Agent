# Data Model

SalesCompass uses Postgres for durable storage and Redis for cached ICP analysis outputs.

## users

- `id`
- `email`
- `username`
- `hashed_password`
- `created_at`
- `updated_at`

## companies

- `id`
- `user_id`
- `name`
- `mode`: `history` or `no_history`
- `industry`
- `description`
- `average_ticket`
- `margin`
- `conversion_rate`
- `average_sales_cycle`
- `past_clients`
- `past_lost_deals`
- `loss_reasons`
- `current_markets`
- `problem_solved`
- `target_user_guess`
- `hypothetical_ticket`
- `known_competitors`
- `early_leads`
- `created_at`
- `updated_at`

## icp_runs

- `id`
- `user_id`
- `company_id`
- `status`: `pending`, `completed`, or `failed`
- `mode`: `history` or `no_history`
- `input_snapshot`
- `agent_output`
- `baseline_output`
- `action_plan`
- `refinement_notes`
- `error_message`
- `created_at`
- `updated_at`

## evaluation_profiles

- `id`
- `name`
- `mode`
- `profile_input`
- `expected_confidence`: `low`, `medium`, or `high`
- `thin_data_case`
- `created_at`

## evaluation_results

- `id`
- `evaluation_profile_id`
- `baseline_input`
- `agent_output`
- `confidence_pass`
- `human_preference`: `baseline`, `agent`, `tie`, or empty until reviewed
- `notes`
- `created_at`

## feedback

Existing human feedback on ICP runs remains available:

- `id`
- `run_id`
- `rating`
- `confidence`
- `notes`
- `created_at`
