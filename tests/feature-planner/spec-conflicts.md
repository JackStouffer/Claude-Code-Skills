# Plan Notes: Async Audit-Log Export

## Seed idea

Admins export their tenant's audit log as a file. Today the export runs inside
the HTTP request and times out for large tenants. We want the export to run as a
background job, and the admin downloads the file when it is ready. Confirmed
understanding: move the existing audit-log export to an async job with a status
endpoint and a download link; do not change what the export contains.

## Background

### Current state
- The export today is `GET /api/v1/audit-logs/export`. It streams CSV inside the
  request. Exports over about 50k rows hit the 30 s gateway timeout.
  [code src/api/audit/export.py:31]
- Export files are written to the `exports` S3 bucket. A lifecycle rule deletes
  objects 7 days after creation. The bucket uses default SSE-S3 encryption.
  [code infra/s3/exports.tf:12]
- Background jobs run on Celery with one `default` queue and no per-tenant
  concurrency limit. [pkg celery==5.3.6 src/jobs/celery_app.py:8]
- Audit-log queries are tenant-scoped already: `AuditLog.for_tenant()` adds the
  `tenant_id` filter, and the API layer rejects any query that does not go
  through it. [code src/models/audit.py:54]

### Claims from prior docs and people
- The export v2 design doc says export files are kept for 30 days and download
  links stay valid for 30 days. [doc docs/design/export-v2.md: planned]
  Contradicts the 7-day lifecycle rule in the current code above.
- Priya (support lead) says the largest tenant has about 4M audit rows.
  [person Priya Shah, 2026-10-28]

## Intent & scope
- Decision: replace the synchronous export with an async job. The old `GET`
  endpoint stays for one release and then is removed, because two mobile clients
  still call it.
- Non-goal: changing the columns or filters of the export.
- Non-goal: scheduled or recurring exports.

## Core behavior
- Decision: `POST /api/v1/audit-logs/exports` takes the same filters as the old
  endpoint, creates an export job, and returns 202 with an `export_id`.
- Decision: `GET /api/v1/audit-logs/exports/{export_id}` returns the status
  (`queued` | `running` | `done` | `failed`) and, when `done`, a presigned
  download URL for the file in the `exports` bucket.
- Decision: the output format is CSV only.
- Decision: allow one active export per tenant. A second `POST` while one is
  `queued` or `running` returns 409, because the single Celery queue has no
  per-tenant limit and one large tenant could starve the others.

## Edge cases & error handling
- Decision: zero matching rows → the job succeeds and produces a CSV with only
  the header row, so clients do not need a special case.
- Decision: the job fails → status `failed` with an error message. The admin can
  start a new export. No automatic retry, because a failure on a 4M-row tenant is
  most likely a timeout that a retry would repeat.
- Decision: each presigned URL expires after 1 hour. The client calls the status
  endpoint again for a fresh URL, because short-lived links limit the exposure of
  a leaked link.

## Security
- Decision: only tenant admins can create or read exports, through the existing
  `require_role("admin")` check.
- Risk: export files contain user emails and IP addresses. Under the DPA, EU
  tenants' exported data must be encrypted at rest with the tenant's
  customer-managed KMS key. Not decided whether the current SSE-S3 bucket
  encryption is acceptable or per-tenant KMS keys are needed.

## Deferred / open (punted during questioning)
- Notification: whether to email the admin when the export is done, or only show
  the status in the UI. Punted; status polling only for now.
