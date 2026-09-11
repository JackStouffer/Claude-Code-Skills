"""Ingest worker: writes annotation rows. (Synthetic fixture — not real code.)"""


def persist_annotation(conn, row) -> None:
    # Called on every inbound annotation event; the ingest loop runs
    # continuously in production, so writes to `annotations` are ongoing.
    conn.execute(
        "INSERT INTO annotations (hsim, target_uid_path, payload) "
        "VALUES (%s, %s, %s)",
        (row.hsim, row.target_uid_path, row.payload),
    )
