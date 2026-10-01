---
name: test-audit
description: Use when asked to review test quality, prune or clean up a test suite, find low-value, redundant, or filler tests, or check agent-written tests before merging or opening a PR. Triggers on /jacks-skills:test-audit; pass test files, directories, or scope instructions as arguments, or none to audit the current branch's tests (or the whole suite on main/master).
---

# Test audit

A test earns its place only if a plausible bug in production code makes it fail, and no stronger test already fails for that bug.

The audit reports first. Test files change only after the user agrees to the verdicts.

## Scope

```bash
current=$(git branch --show-current)
default=$(git symbolic-ref -q --short refs/remotes/origin/HEAD || echo main)   # e.g. origin/main
```

- **With arguments:** follow them. They may name test files or directories, or describe the scope in words.
- **Without arguments, on the default branch** (`$current` is `main`, `master`, or `${default#origin/}`): audit every test in the repo.
- **Without arguments, on any other branch:** audit the tests the branch adds or changes, committed or not:

  ```bash
  base=$(git merge-base HEAD "$default")
  git diff --name-only "$base"                 # committed and uncommitted changes
  git ls-files --others --exclude-standard     # untracked files
  ```

  Audit the test files from both lists. Label each one untracked if it is in the `ls-files` list, uncommitted if it is in `git diff --name-only HEAD`, and committed otherwise.

Before you judge any test, tell the user which scope you chose and why, and list the in-scope test files. For example: "No arguments and on branch `receipt-summary`, so auditing the tests it changes since `main`: `tests/test_receipt.py` (committed), `tests/test_receipt_edge.py` (untracked)." Or: "No arguments and on `main`, so auditing the whole suite (14 test files)."

Give verdicts only to in-scope tests. Read the rest of the suite too, because the test that owns a contract is often in another file.

## For each test

Read the test and the production code it exercises, then answer:

1. **Contract.** What observable behavior does it protect? Say it in one sentence. No contract means low value.
2. **Bug.** Name a plausible change to production code that makes it fail: an off-by-one, a dropped branch, a wrong default, a missed case, or a broken ordering. Retyping or removing static output, or deleting the function, does not count.
3. **Owner.** Would another test, in any file, fail for that bug? If so, the test at the stronger boundary owns the contract. This one is a duplicate unless it catches a failure the owner can't.
4. **Honesty.** Does the assertion check what the name and setup promise? Watch for a negative test that passes because an earlier guard rejects the input. Watch for an expected value built with the code under test.
5. **History.** Before any DELETE, run `git log --follow -p` on the test file and find the commit that added the test. A test added by a bug fix stays, or gets rewritten, unless another test reproduces that bug.

| Pattern | Looks like | Not this pattern when |
|---|---|---|
| Change detector | Asserts a literal the source emits unconditionally: headings, static markup, constants, config, enum members | The literal is a documented external contract, or logic computes it |
| Tautology | Expected value comes from the code under test, or is compared with itself | |
| Mock echo | Asserts what a mock was told to return | |
| No real assertion | No assert; "doesn't throw" with no failure path; `is not None` on a value that can't be None | |
| Language or framework fact | Already guaranteed by types, schema, or framework | |
| Call shape or private state | Asserts call counts, call arguments, or private attributes | |

## Verdicts

- **KEEP:** names a plausible bug and owns it.
- **DELETE:** no plausible bug fails it, or another test owns the contract.
- **REWRITE:** the contract matters but this test doesn't protect it. Give the assertion it should make.
- **MERGE:** same shape as another test with different data. Name the test it folds into.
- **UNSURE:** give the question that decides it.

A test with a weak assertion is never KEEP. It is REWRITE or DELETE.

## Verify by mutation

Mutate when the user asks for verification or a call is borderline. Cover every named Owner too: apply the bug, and confirm that the owner fails along with the test. An owner you haven't seen fail is a guess. A test that passes against its own named bug is DELETE or REWRITE.

Mutate a copy of the repo, never the user's working tree, which may hold uncommitted work:

```bash
scratch=$(mktemp -d) && cp -R . "$scratch/repo"   # once, from the repo root
cd "$scratch/repo"                                # mutate, run tests, and reset files here
```

To undo a mutation in the copy, copy the file back from the user's tree. Never run `git checkout`, `git restore`, or `git stash` in either tree. When you finish, `git status` in the user's repo must match its state before the audit.

## Report

Group the tests in this order: DELETE, REWRITE, MERGE, UNSURE, KEEP. Use one block per test:

```
tests/test_receipt.py::test_total_line_format  (line 24, committed)
Verdict: REWRITE (tautology)
Why: expected value is built with format_money(order_total(items)), the code under test.
Bug: format_money drops the thousands separator. Mutation: test passed.
Instead: assert the literal "Total: $29.99".
```

Required lines: `Verdict` and `Why`, plus `Bug` (or "none plausible"). Add `Owner` on duplicates, with the mutation that failed both if you ran one. Add `History` when a commit decided the call, and `Instead` on REWRITE and MERGE.

Then:

1. **Counts** per verdict.
2. **Gaps.** List behavior the in-scope code adds that no test catches, including anything only a deleted test caught. "None" is only allowed when every DELETE either has no plausible bug or has an Owner shown failing under mutation.
3. **Patterns.** Give the 2–3 most common patterns as one-line rules for wherever tests get written, such as CLAUDE.md.
4. **Ask** whether to apply the verdicts.

## Apply

Wait for the user's answer. Then edit only test files. Keep regression intent and issue references, and remove imports the deletions leave unused. Run the full suite and report the result. Never weaken a test to make the suite pass.
