# Background context: Bulk contact import (CSV) for a CRM

This is the fixed fixture for the question-generation test. It represents the
state of `plan-notes.md` at the *start of Phase 2*: the seed idea plus the
understanding played back to and confirmed by the user in Phase 1. Nothing below
this line is a decided design — the whole point of Phase 2 is to interrogate it.
The question-generating subagents under test receive ONLY this file as context.

Deliberately, this fixture leaves real ambiguity in every domain so that each of
the eight domain agents has genuine open ground to find questions in. Do not add
decided rounds here — decided items would leave nothing to ask.

## Seed idea

We sell a CRM to small sales teams. Today the only way to get contacts into the
system is one at a time through the web UI, or via our REST API if the customer
can code. Customers keep asking to "just upload a spreadsheet." We want a
self-serve **bulk contact import** feature: a user uploads a CSV of contacts and
the system creates (or updates) contact records from it, through the web app, no
engineering help needed.

A contact in our system today has: `first_name`, `last_name`, `email` (unique per
account), `phone`, `company`, `owner` (a user in the account who owns the
relationship), and an open-ended `tags` list. Email is currently the only
uniqueness constraint. Contacts belong to an account (the customer org); a CRM
account can have many users with different roles (admin, member, read-only).

## Understanding played back and confirmed in Phase 1

- The user uploads a CSV file in the web app; we map its columns to contact
  fields; we import the rows as contact records into their account.
- It is self-serve — a non-technical sales ops person should be able to do it
  without talking to us.
- It must handle "messy" real-world spreadsheets exported from other CRMs,
  Google Sheets, and Excel, not just files in our exact format.
- Both creating new contacts and updating existing ones from a file are in view;
  the user was not sure how the system should decide which is which.
- The files are "not huge but not tiny" — the user threw out "a few thousand
  rows, maybe up to fifty thousand once when they migrate off their old CRM."
- This is the first of possibly several importers (they mused about importing
  companies and deals later), but for now the scope is contacts only.

## What is NOT yet decided (open going into Phase 2)

Everything else. The user has not thought about: how to match a CSV row to an
existing contact, what happens to rows that fail, whether the whole file is
rejected or partially imported, how column mapping works for unrecognized
headers, what the user sees while a large file processes, who is allowed to
import, what happens to the `owner` and `tags` fields on import, duplicate rows
within one file, encoding/format quirks, or how this rides on top of the existing
single-contact create path and its validation. Treat all of that as open.
