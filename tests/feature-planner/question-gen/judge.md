First line of your reply must be: `MODEL: <your exact model id>`.

You are judging the OPEN QUESTIONS that a question-generation agent produced for
a single feature-planning session, one file per domain. The agent saw only the
background context and wrote up to six questions for each of eight domains. You are
judging question *quality*: would these questions, asked of the user, move the
plan forward — or are they generic, redundant, off-domain, or built on invented
facts?

The background context the agents were given (the ONLY thing they knew) is at:
{{BACKGROUND_PATH}}

Read it in full first. It is a seed idea plus confirmed understanding, with most
design decisions deliberately left OPEN. A good question targets that open
ground. A question is bad if it (a) is generic ("have you thought about errors?"
with no specific case), (b) asks something the background already answers or that
is explicitly out of scope, (c) belongs to a different domain than the one it was
filed under, or (d) assumes a concrete fact about the system that the background
never states (invented facts — the most dangerous failure, because the user
can't tell an invented premise from a real one).

The eight domain files to judge (each is JSON: a domain name and a questions
array):
{{DOMAIN_FILES}}

For EACH domain, score independently and honestly. Do not grade on a curve; a
domain with three sharp questions should score higher than one with six vague
ones.

- `total_count`: how many questions the file contains.
- `useful_count`: how many of them are genuinely worth asking the user (specific,
  on open ground, on-domain, non-redundant, no invented premise). This is the
  headline number.
- `specificity_1_5`: 5 = every question names a concrete case/decision; 1 = mostly
  generic prompts that could be pasted into any feature.
- `assumption_surfacing_1_5`: 5 = questions repeatedly expose a real undecided
  choice the user hasn't confronted; 1 = trivia that doesn't change the design.
- `on_domain`: fraction (0.0-1.0) of questions that actually belong to this
  domain rather than another.
- `non_redundant`: fraction (0.0-1.0) that are NOT already answered by the
  background or out of scope.
- `options_quality_1_5`: for questions that offered `options`, are the options
  real, distinct approaches with honest tradeoffs? Use null if this domain
  offered no options anywhere.
- `offbase_or_redundant`: list the questions (short paraphrase) that assume
  invented facts, are out of scope, already answered, or off-domain. Empty if
  none.
- `acceptable`: true only if you would send this domain's set to the user roughly
  as-is — net useful, on-domain, no invented premises, at least a few sharp
  questions.

Write {{OUT_PATH}} as JSON only:
{
  "domains": {
    "<domain name verbatim>": {
      "total_count": n,
      "useful_count": n,
      "specificity_1_5": n,
      "assumption_surfacing_1_5": n,
      "on_domain": 0.0,
      "non_redundant": 0.0,
      "options_quality_1_5": n,
      "offbase_or_redundant": ["..."],
      "acceptable": true
    }
    // ... one entry per domain file, keyed by the domain name in that file
  },
  "best_domain": "<domain name>",
  "worst_domain": "<domain name>",
  "overall_read": "two sentences max: does the generator produce good questions here, and where does it fall down"
}

Return only the MODEL line and a one-line verdict.
