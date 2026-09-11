"""Migration runner. (Synthetic fixture — not real code.)"""
from db.engine import get_connection


def run(dsn, migrations) -> None:
    conn = get_connection(dsn)
    for migration in migrations:
        migration.apply(conn)
