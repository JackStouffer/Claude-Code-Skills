"""Initial schema: annotations table. (Synthetic fixture — not real code.)"""
from yoyo import step

# Base table. Note: no index on target_uid_path is created here.
steps = [
    step(
        """
        CREATE TABLE annotations (
            id            BIGSERIAL PRIMARY KEY,
            hsim          TEXT NOT NULL,
            target_uid_path TEXT NOT NULL,
            payload       JSONB NOT NULL,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """,
        "DROP TABLE annotations",
    ),
]
