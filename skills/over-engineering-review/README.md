# over-engineering-review

A skill that reviews the current branch's changes for one thing only: code that is more
complicated than the problem it solves.

## The problem

You can't tell whether an abstraction is speculative without knowing the requirement it was
built for. A reviewer that reads only the diff guesses at that requirement. It flags
constructs the ticket actually asked for, and it pads the list to look thorough.

## How the skill works

1. **Gather the intent first.** It fetches the Jira ticket, Confluence page, or ADO PR passed
   as an argument, or mines the commit messages for one. If it finds no requirement, it asks
   the user and does not guess.
2. **Scope the review** to the changed lines and the code they touch.
3. **Ask "couldn't we just…?"** for every new abstraction, layer, knob, wrapper, or dependency,
   measured against the present requirement.
4. **Verify the candidates** with one fresh `over-engineering-verifier` agent (bundled with
   the plugin, read-only) that checks all of them at once. The agent gets only the
   requirement and, per finding, the construct and the simpler alternative, not the
   reasoning that produced the findings. It returns SURVIVES or DROP for each.
5. **Report** only the surviving findings, each tied to specific changed lines and a quote
   from the requirement.

## Core principle

No "why," no critique. Hypothetical future needs never justify complexity, and "appropriately
scoped" is a valid result.

## When to use it

Before you merge a branch or open a PR, when you suspect the change does more than its ticket
asks.
