#!/usr/bin/env python3
"""
Extracts questions from a PDF into a raw JSON list.

Usage:
  python tools/extract_ptcb_pdf.py --input "/path/to/ptcb_exam_questions_only.pdf" --output data/ptcb_questions_raw.json

Notes:
- This uses simple heuristics to split questions by numbered lines (e.g. "1. " or "1)").
- Choices starting with A./A) are captured and separated.
- The script is conservative: it will not guess correct answers.
"""
import argparse
import json
import re
from pathlib import Path

try:
    import pdfplumber
except Exception:
    raise SystemExit("Missing dependency: install pdfplumber (pip install pdfplumber)")


Q_START = re.compile(r"^\s*([0-9]{1,4})[\.|\)]\s+(.*)")
Q_START_ALT = re.compile(r"^\s*Question\s+([0-9]+(?:\.[0-9]+)*)\s*:\s*(.*)", re.IGNORECASE)
CHOICE = re.compile(r"^\s*([A-D])[\.|\)]\s+(.*)")


def extract_text_pages(pdf_path: Path):
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            yield text


def parse_questions(text_pages):
    questions = []
    current = None
    for text in text_pages:
        for line in text.splitlines():
            m = Q_START.match(line)
            if not m:
                m = Q_START_ALT.match(line)
            if m:
                # start new question
                if current:
                    questions.append(current)
                num = m.group(1)
                rest = m.group(2).strip()
                current = {
                    "raw_number": num,
                    "raw_lines": [rest],
                    "choices": [],
                }
                continue

            # collect choice lines if they appear
            if current:
                c = CHOICE.match(line)
                if c:
                    label = c.group(1)
                    text = c.group(2).strip()
                    current["choices"].append({"label": label, "text": text})
                else:
                    # append to last raw_lines if not a new question or choice
                    if line.strip() == "":
                        # ignore empty lines
                        continue
                    current["raw_lines"].append(line.strip())

    if current:
        questions.append(current)
    return questions


def normalize_questions(parsed):
    out = []
    for i, q in enumerate(parsed, start=1):
        stem_lines = []
        # stem is raw_lines up to the first choice marker if choices exist inline
        if q["choices"]:
            stem_lines = q["raw_lines"]
        else:
            # attempt to split choices from raw_lines by searching for A. or A)
            lines = q["raw_lines"]
            choices = []
            stem_acc = []
            for ln in lines:
                cm = CHOICE.match(ln)
                if cm:
                    choices.append({"label": cm.group(1), "text": cm.group(2).strip()})
                else:
                    # also support inline "A. text B. text" patterns (rare)
                    stem_acc.append(ln)
            stem_lines = stem_acc
            if choices:
                q["choices"] = choices

        stem = " ".join(stem_lines).strip()
        choices_text = [c["text"] for c in q.get("choices", [])]

        out.append({
            "id": f"ptcb-org-{i:04d}",
            "raw_number": q.get("raw_number"),
            "text": stem,
            "choices": choices_text,
            "correct": None,
            "notes": "\n".join(q.get("raw_lines", [])),
        })
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()

    pdf_path = Path(args.input)
    out_path = Path(args.output)

    if not pdf_path.exists():
        raise SystemExit(f"Input PDF not found: {pdf_path}")

    pages = list(extract_text_pages(pdf_path))
    parsed = parse_questions(pages)
    normalized = normalize_questions(parsed)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(normalized, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(normalized)} parsed questions to {out_path}")


if __name__ == "__main__":
    main()
