# Feature Plan: [Feature Name]

## Overview

2-3 sentence summary of what this feature does and why.

## Goals & Non-Goals

### Goals

- Bulleted list of what this feature WILL do

### Non-Goals

- Bulleted list of what this feature explicitly WILL NOT do (and why)

## Current State & Verified Facts

Background facts with their source tags, grouped by subsystem

## Detailed Design

### User Flow

Step-by-step walkthrough of the happy path. Number each step.

### Data Model

Describe entities, relationships, and key fields. Use a simple schema
notation or table: not a full DDL, just enough to communicate structure.

### API / Interface

If applicable, describe the key interfaces. Method signatures, endpoint
shapes, CLI flags, whatever is relevant.

### Edge Cases & Error Handling

A table or list of edge cases and how each is handled. Reference the
decisions made during questioning.

### Design Decisions

Document each significant tradeoff that was discussed, what was chosen,
and why. This is the most valuable part of the plan and the most
important to be detailed in. 

State what was chosen. Give the reason and the rejected alternatives only
as the spec records them. If the spec records none, write
`Reason not recorded`.

## Implementation Plan

Order of implementation. Split the execution into a numbered list of
discrete tasks. Each task should get a "Relies on:" line at the end
which names the facts and decisions that task depends on from the 
"Current State & Verified Facts" section.

## Open Questions

Key risks, and anything the implementer should watch out for. List anything
that still needs resolution. Include every background conflict and every
risk that has no decision.

Be honest. It's better to flag unknowns than to pretend everything is settled.

## Sources

List all sources used that are not this repo, e.g. docs, plans, code packages
(with versions), and people. 
