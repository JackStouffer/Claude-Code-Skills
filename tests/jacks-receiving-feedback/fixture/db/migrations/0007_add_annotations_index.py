"""Add index on annotations.target_uid_path. (Synthetic fixture — not real code.)"""
from yoyo import step

# Plain CREATE INDEX (no CONCURRENTLY).
steps = [
    step(
        "CREATE INDEX idx_annotations_target_uid_path "
        "ON annotations (target_uid_path)",
        "DROP INDEX idx_annotations_target_uid_path",
    ),
]
