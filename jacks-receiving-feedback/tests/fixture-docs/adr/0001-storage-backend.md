# ADR-0001: Storage backend

Status: Accepted

## Decision

Postgres is the system of record for all **durable** data: results, jobs,
annotations, and audit history. New durable stores must not introduce a second
database engine without a superseding ADR.

## Scope and carve-outs

This decision governs durable, source-of-truth data only. **Ephemeral,
reconstructible caches are explicitly out of scope** and may use an in-memory or
key-value store (e.g. Redis) at the team's discretion, because losing the cache
costs only recomputation, not data. A cache is not "durable data" under this
ADR.

## Consequences

Durable schema changes go through Alembic. Cache stores have no such
requirement.
