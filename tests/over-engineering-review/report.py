"""Extract each rep's report from run.sh's stream-json output.

Usage: python3 report.py <out-dir>. Writes <rep>.md next to each <rep>.jsonl and
prints cost and turns. The report is the longest top-level assistant text,
because a run can end on a short follow-up turn after the real report.
"""

import json
import pathlib
import sys

for path in sorted(pathlib.Path(sys.argv[1]).glob("*.jsonl")):
    texts, result = [], {}
    for line in path.read_text().splitlines():
        event = json.loads(line)
        if event.get("type") == "result":
            result = event
        elif event.get("type") == "assistant" and not event.get("parent_tool_use_id"):
            texts += [b["text"] for b in event["message"]["content"] if b.get("type") == "text"]
    report = max(texts, key=len, default="")
    path.with_suffix(".md").write_text(report)
    print(
        f"{path.stem:12} cost ${result.get('total_cost_usd', 0):.2f}"
        f"  turns {result.get('num_turns')}  words {len(report.split())}"
    )
