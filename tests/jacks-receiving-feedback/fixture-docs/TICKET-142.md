# TICKET-142: Cache matcher results

## Problem

The matcher recomputes identical results per request. Repeated recomputation is
wasteful for the hot path.

## Requirements

- R1. Cached results MUST NOT be served if they are older than **1 hour**. A
  clinician must never see indication output that lagged an edition change by
  more than an hour. This is a content-freshness requirement, not a performance
  tuning knob.
- R2. The cache key must include the full indication identity, not just the HSIM.
- R3. A cache miss must fall through to the live matcher transparently.

## Non-requirements

- No specific latency target is mandated. Any measurable reduction is
  acceptable; the freshness bound in R1 takes priority over hit rate.
