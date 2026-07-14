from sqlalchemy import JSON
from sqlalchemy.dialects import postgresql

JSONBType = JSON().with_variant(postgresql.JSONB(), "postgresql")
