#!/usr/bin/env python3
"""Inject explanations from JSON into the Motoko PTCB seed file safely.

Reads `data/ptcb_org_explanations_draft.json` with structure:
{
  "ptcb-org-0001": {"generated_explanation": "...", "existing_explanation": "..."},
  ...
}

Backs up the original seed to `tmp/exams-pool-ptcb-org.mo.bak` and writes the
updated seed in-place. Replaces the `explanation = "..."` field for matching
question `id` entries.
"""
import json
import re
from pathlib import Path

SEED = Path('src/backend/lib/exams-pool-ptcb-org.mo')
IN = Path('data/ptcb_org_explanations_draft.json')
BACKUP = Path('tmp/exams-pool-ptcb-org.mo.bak')

if not IN.exists():
    print('Draft JSON not found:', IN)
    raise SystemExit(1)

print('Reading drafts from', IN)
drafts = json.loads(IN.read_text(encoding='utf-8'))
print('Loaded drafts for', len(drafts), 'questions')

txt = SEED.read_text(encoding='utf-8')

# Pattern to find each addQuestionIfMissing block and capture its body
pat = re.compile(r"addQuestionIfMissing\(questions,\s*\{", re.M)

# We'll iterate through all occurrences and do a targeted replacement by ID
# To simplify, find each block's start index by locating the opening and then
# performing balanced-brace extraction.

indices = [m.start() for m in pat.finditer(txt)]
print('Found', len(indices), 'question blocks')

new_txt = txt
changes = 0

for idx in indices:
    # find the block boundaries
    start = txt.find('{', idx)
    i = start + 1
    depth = 1
    while i < len(txt) and depth > 0:
        if txt[i] == '{': depth += 1
        elif txt[i] == '}': depth -= 1
        i += 1
    block = txt[start+1:i-1]

    # extract id
    m_id = re.search(r'id\s*=\s*"([^"]+)"', block)
    if not m_id:
        continue
    qid = m_id.group(1)
    if qid not in drafts:
        continue
    # find existing explanation assignment within block
    m_expl = re.search(r'explanation\s*=\s*"((?:[^\\"]|\\.)*)"', block, re.S)
    if not m_expl:
        continue
    new_expl_raw = drafts[qid].get('generated_explanation') or drafts[qid].get('explanation') or ''
    # escape for Motoko string literal
    new_expl = new_expl_raw.replace('\\', '\\\\').replace('"', '\\"')
    # enforce length limit
    if len(new_expl) > 1900:
        new_expl = new_expl[:1897] + '...'
    # build new block body
    new_block = block[:m_expl.start()] + f'explanation = "{new_expl}"' + block[m_expl.end():]
    # replace in new_txt (only first occurrence to keep offsets working)
    new_txt = new_txt.replace(block, new_block, 1)
    changes += 1

if changes == 0:
    print('No changes applied (no matching IDs or blocks).')
else:
    BACKUP.parent.mkdir(parents=True, exist_ok=True)
    BACKUP.write_text(txt, encoding='utf-8')
    SEED.write_text(new_txt, encoding='utf-8')
    print(f'Injected explanations for {changes} questions into {SEED} (backup saved to {BACKUP})')
