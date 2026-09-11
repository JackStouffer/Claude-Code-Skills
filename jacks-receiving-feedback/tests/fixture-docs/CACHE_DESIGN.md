# Design: Result cache for the matcher service

Status: Draft (under review)
Author: platform team
Supersedes: nothing

## Motivation

The matcher recomputes the same indication results on every request. We propose
a result cache in front of the matcher to cut repeated work. Requirement source:
TICKET-142.

## Proposal

- **Store:** an in-process LRU cache, backed by Redis for cross-pod sharing.
- **TTL:** cache entries expire after 24 hours.
- **Key:** `(hsim, target_uid_path)`.
- **Invalidation:** entries are dropped on TTL expiry only; no explicit
  invalidation on edition publish.

## Expected impact

We expect this to reduce matcher p99 latency by roughly 80% for the hot path,
which is the main justification for building it.

## Out of scope

Cache warming and metrics are deferred to a follow-up.
