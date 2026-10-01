# test-audit

A skill for finding low-value tests (tests that would not catch a real bug) and
then deleting, rewriting, or merging them once you agree.

## The problem

Agent-written test suites fill up with tests that pass and protect nothing:
change detectors that copy a literal from the source, tautologies, mock echoes,
call-count checks, and duplicates of a test that already exists in another file.
They cost run time, they break on harmless refactors, and they make coverage
look better than it is.

## How the skill works

1. **Scope.** With arguments, it follows them (files, directories, or
   instructions in words). Without arguments on `main`/`master`, it audits the
   whole suite. Without arguments on any other branch, it audits the tests the
   branch adds or changes, including uncommitted and untracked files. It tells
   you which scope it chose before it starts. It still reads the rest of the
   suite to find the tests that own each contract.
2. **Judge each test** by its contract, a plausible bug that makes it fail, the
   test that owns that bug, whether the assertion is honest, and its git
   history (a regression test is not deleted unless something else reproduces
   the bug). A pattern table covers the common junk shapes.
3. **Verify by mutation** when asked or when a call is borderline. It also
   confirms that each named owner fails for the same bug. Mutations happen in a
   temp copy of the repo, never in your working tree, so uncommitted work can't
   be lost.
4. **Report** one block per test, grouped DELETE → REWRITE → MERGE → UNSURE →
   KEEP, then counts, coverage gaps, and the recurring patterns as rules to put
   where tests get written (e.g. CLAUDE.md). When the built-in `ReportFindings`
   tool exists, the non-KEEP verdicts go through it instead (and onto the
   review board, if the mod is loaded).
5. **Apply** only after you approve: test files only, then a full suite run.

## Core principle

A test earns its place only if a plausible bug in production code makes it
fail, and no stronger test already fails for that bug.

## Testing

See `tests/test-audit/test-scenario.md` (fixtures: `make_fixture.py`,
`make_branch_fixture.py`). Without the skill, Opus already makes the verdict
calls correctly. With Opus, the skill adds a report-before-editing step, a
stable report shape, and safe mutation. With Sonnet, it also turns on mutation
verification and fixes missed tautologies. Known limitation: Sonnet sometimes
misses the gap left by deleting a private-state test that was the only test of
some behavior.
