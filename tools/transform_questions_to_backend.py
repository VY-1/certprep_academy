#!/usr/bin/env python3
"""
Transform raw parsed questions into backend JSON schema expected by the Motoko seeding step.

Usage:
  python tools/transform_questions_to_backend.py --input data/ptcb_questions_raw.json --output data/ptcb_questions_backend.json

This script produces a conservative mapping and sets `answer_index` to null when unknown.
"""
import argparse
import json
from pathlib import Path


def transform_question(q):
    # Conservative mapping: keep id, map text -> stem, choices -> options, answer_index null
    options = []
    for idx, c in enumerate(q.get("choices", [])):
        options.append({"id": chr(ord("A") + idx), "text": c})

    return {
        "question_id": q.get("id"),
        "stem": q.get("text") or q.get("notes"),
        "options": options,
        "answer_index": None,
        "explanation": None,
        "tags": q.get("tags", []),
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()

    inp = Path(args.input)
    outp = Path(args.output)
    if not inp.exists():
        raise SystemExit(f"Input JSON not found: {inp}")

    raw = json.loads(inp.read_text(encoding="utf-8"))
    out = [transform_question(q) for q in raw]

    outp.parent.mkdir(parents=True, exist_ok=True)
    outp.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(out)} backend-formatted questions to {outp}")


if __name__ == "__main__":
    main()
