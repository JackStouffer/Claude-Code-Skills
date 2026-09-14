"""Database connection factory. (Synthetic fixture — not real code.)"""
import os

from psycopg import connect

# libpq options applied to every connection this factory hands out.
_DEFAULT_OPTIONS = "-c lock_timeout=5s -c statement_timeout=30s"


def get_connection(dsn):
    options = os.environ.get("DB_CONNECT_OPTIONS", _DEFAULT_OPTIONS)
    return connect(dsn, options=options)
