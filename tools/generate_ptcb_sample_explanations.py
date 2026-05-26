#!/usr/bin/env python3
import re
import json
from pathlib import Path

MO_FILE = Path("src/backend/lib/exams-pool-ptcb-org.mo")
OUT_FILE = Path("/tmp/ptcb_sample_explanations.json")

# Pick a mixed sample: 5 calculation-like and 5 non-calculation IDs
CALC_IDS = [
    "ptcb-org-0209",
    "ptcb-org-0210",
    "ptcb-org-0297",
    "ptcb-org-0309",
    "ptcb-org-0310",
]

NONCALC_IDS = [
    "ptcb-org-0001",
    "ptcb-org-0007",
    "ptcb-org-0027",
    "ptcb-org-0033",
    "ptcb-org-0060",
]

SAMPLE_IDS = CALC_IDS + NONCALC_IDS

def parse_questions(text):
    parts = text.split("addQuestionIfMissing(questions,")
    questions = {}
    for p in parts[1:]:
        block = p.split("});", 1)[0]
        # extract id
        m_id = re.search(r'id\s*=\s*"([^"]+)"', block)
        if not m_id:
            continue
        qid = m_id.group(1)
        # extract text
        m_text = re.search(r'text\s*=\s*"([\s\S]*?)";\s*options\s*=\s*\[', block)
        text_val = m_text.group(1).strip() if m_text else ""
        # extract options
        m_opts = re.search(r'options\s*=\s*\[([\s\S]*?)\];', block)
        opts = []
        if m_opts:
            opts_raw = m_opts.group(1)
            opts = re.findall(r'"([^"]+)"', opts_raw)
        # extract existing explanation
        m_expl = re.search(r'explanation\s*=\s*"([\s\S]*?)";\s*knowledgeDomain', block)
        expl = m_expl.group(1).strip() if m_expl else ""
        # correct option index
        m_corr = re.search(r'correctOptionIndex\s*=\s*(\d+)', block)
        corr = int(m_corr.group(1)) if m_corr else None
        questions[qid] = {"id": qid, "text": text_val, "options": opts, "explanation": expl, "correctIndex": corr}
    return questions

def generate_calc_explanation(q):
    # Produce a conservative, PTCB-style step template and flag assumptions
    lines = []
    lines.append("Solution (PTCB-style):")
    lines.append("Assumptions: Using standard unit conversions where needed (e.g., 1 tsp = 5 mL, 1 fl oz = 30 mL, 1 kg = 2.2 lb). If the question implies bilateral dosing or per-eye dosing, that is noted below.")
    lines.append("")
    lines.append("Steps:")
    lines.append("1. Identify the requested quantity and units from the stem.")
    lines.append("2. Convert all quantities to compatible units (show conversion formulas).")
    lines.append("3. Apply the dose/concentration formula: (desired dose) ÷ (concentration) or (total volume × concentration) as appropriate.")
    lines.append("")
    lines.append("Example calculation (method shown; verify numeric interpretation of the stem):")
    lines.append("- Set variables from stem (e.g., Volume_mL = ..., DropsPermL = ..., DropsPerDose = ...)")
    lines.append("- Compute total available dose or total drops, then divide by daily use to find days supply.")
    lines.append("")
    ci = q.get("correctIndex")
    opt = q.get("options")[ci] if (ci is not None and q.get("options")) else "(see options)"
    lines.append(f"Final answer: Option {chr(65+ci)} — {opt}")
    lines.append("")
    lines.append("Exam tip: Write conversion factors on scratch paper and label units at every step to avoid arithmetic errors.")
    return "\n".join(lines)

def generate_noncalc_explanation(q):
    ci = q.get("correctIndex")
    opt = q.get("options")[ci] if (ci is not None and q.get("options")) else "(see options)"
    lines = []
    lines.append(f"Answer: Option {chr(65+ci)} — {opt}")
    lines.append("")
    lines.append("Rationale:")
    lines.append("- One-line explanation why the correct option best answers the stem; eliminate distractors briefly.")
    lines.append("")
    # Option review
    lines.append("Option review:")
    for i, o in enumerate(q.get("options",[])):
        mark = "Correct" if i == ci else "Not correct"
        lines.append(f"{chr(65+i)}: {o} — {mark}.")
    lines.append("")
    lines.append("Exam tip: Read the stem for qualifiers (e.g., first, best, except) and eliminate distractors that are factually true but irrelevant to the specific question.")
    return "\n".join(lines)

def main():
    if not MO_FILE.exists():
        print(f"Source file not found: {MO_FILE}")
        return
    text = MO_FILE.read_text()
    qs = parse_questions(text)
    sample = []
    for qid in SAMPLE_IDS:
        q = qs.get(qid)
        if not q:
            continue
        if qid in CALC_IDS:
            expl = generate_calc_explanation(q)
        else:
            expl = generate_noncalc_explanation(q)
        sample.append({"id": qid, "text": q.get("text"), "generated_explanation": expl})

    OUT_FILE.write_text(json.dumps(sample, indent=2))
    print(f"Wrote sample explanations to: {OUT_FILE}")

if __name__ == '__main__':
    main()
