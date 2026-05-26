#!/usr/bin/env python3
import json
from pathlib import Path
import re

SEED_PATH = Path('src/backend/lib/exams-pool-ptcb-org.mo')
SAMPLE = Path('/tmp/ptcb_sample_explanations.json')

def escape_motoko_string(s: str) -> str:
    return s.replace('\\', '\\\\').replace('"', '\\"')

def load_sample():
    return json.loads(SAMPLE.read_text(encoding='utf-8'))

def apply_changes(sample):
    txt = SEED_PATH.read_text(encoding='utf-8')
    changes = 0
    for item in sample:
        qid = item['id']
        expl = item['generated_explanation']
        expl_esc = escape_motoko_string(expl)
        # pattern to find the question block by id, then replace the explanation = "..." part
        pattern = re.compile(r'(addQuestionIfMissing\(questions, \{\s*id = "' + re.escape(qid) + r'";[\s\S]*?explanation = ")([\s\S]*?)(";[\s\S]*?\}\);)', re.M)
        m = pattern.search(txt)
        if not m:
            # fallback: try simpler pattern matching capturing up to knowledgeDomain
            pattern2 = re.compile(r'(id = "' + re.escape(qid) + r'";[\s\S]*?explanation = ")([\s\S]*?)(";\s*knowledgeDomain)', re.M)
            m = pattern2.search(txt)
        if not m:
            print(f'Warning: could not locate question {qid} in seed file')
            continue
        before = m.group(1)
        after = m.group(3)
        new_fragment = before + expl_esc + after
        txt = txt[:m.start()] + new_fragment + txt[m.end():]
        changes += 1

    if changes > 0:
        SEED_PATH.write_text(txt, encoding='utf-8')
    return changes

def main():
    if not SEED_PATH.exists():
        print(f'Seed file not found: {SEED_PATH}')
        return
    if not SAMPLE.exists():
        print(f'Sample file not found: {SAMPLE}')
        return
    sample = load_sample()
    changes = apply_changes(sample)
    print(f'Applied explanations for {changes} questions')

if __name__ == '__main__':
    main()
