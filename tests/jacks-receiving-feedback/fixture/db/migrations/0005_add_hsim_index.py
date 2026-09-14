"""Add index on annotations.hsim. (Synthetic fixture — not real code.)"""
from yoyo import step

# Different column (hsim), not target_uid_path.
steps = [
    step(
        "CREATE INDEX CONCURRENTLY idx_annotations_hsim ON annotations (hsim)",
        "DROP INDEX idx_annotations_hsim",
    ),
]
