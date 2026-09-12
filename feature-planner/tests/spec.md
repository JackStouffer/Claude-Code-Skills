# Plan Notes: Idempotent Webhook Ingestion Endpoint

This file is the fixed fixture for the Phase-4 test. It is written in the exact
shape the skill produces at the end of Phase 3: a seed idea, one section per
questioning round recording decisions (not discussion), and a confirmed
consolidated spec. The Phase-4 subagent under test receives ONLY this file. The
judge scores each plan against the `## Consolidated spec (confirmed)` section
below, so every checkable item lives there.

## Seed idea

We receive webhooks from a payments provider (Stripe-style). They retry
aggressively and can deliver the same event multiple times and out of order. We
need an HTTP endpoint that ingests these events, never double-processes one, and
hands each event to our internal processing pipeline exactly once. Confirmed
understanding: a thin, durable front door that dedupes and enqueues; it does not
itself do the business processing.

## Round 1 — Intent & scope
- Problem: provider retries + at-least-once delivery cause duplicate and
  out-of-order events; downstream processing is not itself idempotent, so
  duplicates cause double refunds / double fulfillment.
- Target user: internal — the payments processing pipeline is the consumer, not
  an end user. Endpoint is provider-facing only.
- Success: every distinct provider event is enqueued exactly once; the provider
  stops retrying (gets a 2xx) within its retry window.
- Out of scope: the actual business processing of events; a provider-agnostic
  abstraction (this endpoint is for the one payments provider only); replaying
  historical events from before this endpoint existed.

## Round 2 — Core behavior
- Happy path: provider POSTs JSON event → verify signature → parse provider
  event id → insert `(event_id)` into a dedup table → on fresh insert, write the
  raw payload to the queue → return 200. On duplicate id, skip the enqueue and
  still return 200.
- Data model: `webhook_events(event_id PK, received_at, status, payload_hash)`;
  a durable queue (existing SQS) carries the raw payload downstream.
- Ordering: the endpoint does NOT reorder events. Downstream is responsible for
  ordering using the provider's `sequence`/`created` field; endpoint just records
  arrival.

## Round 3 — Edge cases & error handling
- Duplicate delivery: dedup table insert conflict → treat as success, return 200,
  do not re-enqueue. Decided via unique constraint + INSERT ... ON CONFLICT DO
  NOTHING, checking rows-affected to decide whether to enqueue.
- Bad signature: return 401, do not store, do not enqueue.
- Malformed / unparseable body: return 400, do not store.
- Enqueue fails AFTER the dedup row is committed: this is the critical failure.
  Decision: the dedup insert and the enqueue must not silently diverge — see the
  tradeoff in Round 4. Endpoint returns 500 so the provider retries.
- Provider retry window: ~3 days; endpoint must be durable enough that a transient
  outage does not lose events (the provider's own retries cover this).

## Round 4 — Design tradeoffs
- Dedup-then-enqueue atomicity (chosen): the dedup row is inserted with
  status='pending', THEN the enqueue happens, THEN status is set to 'queued'. A
  background sweeper re-enqueues any row stuck in 'pending' past a threshold.
  Chosen over a full 2-phase/outbox transaction because the queue is not
  transactional with the DB, and the sweeper makes the operation effectively
  exactly-once without distributed-transaction machinery. Accepts a small window
  where a crash between insert and enqueue leaves a 'pending' row the sweeper
  later heals (so downstream must still tolerate rare duplicates).
- Synchronous vs async enqueue (chosen: synchronous within the request): keeps
  the endpoint simple and lets us return 500 to trigger provider retry on failure,
  at the cost of request latency bounded by queue write latency.
- Signature verification library vs hand-rolled HMAC (chosen: provider's official
  verification helper) for correctness on timestamp-tolerance and constant-time
  compare.

## Round 5 — Integration & dependencies
- Depends on: existing Postgres (for the dedup table), existing SQS queue
  (downstream transport), the provider's signing secret in our secrets manager.
- No schema migration ordering concerns beyond creating the one new table.
- Backward compatibility: none — new endpoint, new table.

## Round 7 — Operability
- Metrics: count of received / deduped / enqueued / failed, and count of rows the
  sweeper healed (a rising sweeper count is the early warning that enqueue is
  flaky).
- Alert: page if enqueue-failure rate exceeds threshold or sweeper backlog grows.
- Config: signing secret and dedup-table retention window are configurable; the
  'pending' sweeper threshold is configurable.
- Rollback: endpoint is additive; disable by pointing the provider's webhook URL
  back to the old target. No data migration to reverse.

## Deferred / open (punted during questioning)
- Retention: how long to keep `webhook_events` rows before pruning was not decided
  — left as an open question (leaning 90 days but unconfirmed).
- Multi-region: whether the dedup table needs to be globally unique across regions
  if we later run the endpoint in two regions — punted, single-region for now.

## Consolidated spec (confirmed)

**Overview.** A thin, durable, provider-facing HTTP endpoint that ingests
payments webhooks, dedupes by provider event id, and enqueues each distinct event
exactly once to the existing SQS pipeline. It does not process events itself.

**Goals.**
1. Enqueue every distinct provider event exactly once (effectively — see sweeper).
2. Return 2xx within the provider's retry window so retries stop.
3. Be durable across transient outages, relying on provider retries for recovery.
4. Emit metrics and an alert for enqueue failure / sweeper backlog.

**Non-goals.**
1. Business processing of events (downstream pipeline owns it).
2. Event reordering (downstream orders by the provider sequence field).
3. A provider-agnostic / multi-provider abstraction (this one provider only).
4. Replaying historical pre-launch events.

**Core behavior.** POST → verify signature → parse event id → `INSERT ... ON
CONFLICT DO NOTHING` into `webhook_events` with status='pending' → if a row was
inserted, write raw payload to SQS then set status='queued' → return 200. On
conflict (duplicate), return 200 without enqueueing.

**Data model.** `webhook_events(event_id PK, received_at, status ['pending' |
'queued'], payload_hash)`. Downstream transport is the existing SQS queue.

**Edge cases (decided).**
- Duplicate delivery → 200, no re-enqueue (detected via rows-affected on the
  conflict insert).
- Bad signature → 401, nothing stored or enqueued.
- Malformed body → 400, nothing stored.
- Enqueue fails after the pending row is committed → return 500 (provider
  retries); the background sweeper re-enqueues any row stuck in 'pending'.

**Design decisions (chosen, with rationale).**
- Pending-row + background sweeper instead of a DB/queue distributed transaction,
  because SQS is not transactional with Postgres; accepts a rare crash window that
  the sweeper heals, so downstream must tolerate rare duplicates.
- Synchronous enqueue inside the request, so a failure can return 500 and trigger
  provider retry; costs request latency.
- Use the provider's official signature-verification helper, not hand-rolled HMAC,
  for constant-time compare and timestamp tolerance.

**Operability.** Metrics: received / deduped / enqueued / failed / sweeper-healed.
Alert on enqueue-failure rate or sweeper backlog. Configurable: signing secret,
retention window, sweeper threshold. Rollback: repoint the provider webhook URL to
the old target; endpoint is additive.

**Open questions (must be carried forward, NOT silently resolved).**
1. Retention period for `webhook_events` rows before pruning (leaning 90 days,
   unconfirmed).
2. Whether dedup must be globally unique across regions if the endpoint later runs
   multi-region (single-region for now).
