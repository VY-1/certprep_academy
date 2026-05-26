#!/usr/bin/env python3
import re
from pathlib import Path

SEED_PATH = Path('src/backend/lib/exams-pool-ptcb-org.mo')

def option_letter(i):
    return ['A','B','C','D','E','F','G','H'][i] if i<8 else f'opt{i+1}'

def generate_explanation(stem, options, correct_idx):
    # Basic human-like explanation template
    correct_text = options[correct_idx] if 0 <= correct_idx < len(options) else 'the keyed option'
    expl = []
    expl.append(f"The best answer is option {option_letter(correct_idx)} — {correct_text}.")
    expl.append("Rationale: this choice directly addresses the requirement in the question stem while the other options are incomplete or less appropriate.")
    expl.append("Option review:")
    for i,opt in enumerate(options):
        mark = 'Correct' if i==correct_idx else 'Not correct'
        expl.append(f"{option_letter(i)}: {opt} — {mark}.")
    expl.append("Exam tip: Read the stem carefully for qualifiers (e.g., first, best, except) and eliminate distractors that are factually true but irrelevant to the question asked.")
    return ' '.join(expl)

def main():
    txt = SEED_PATH.read_text(encoding='utf-8')

    pattern = re.compile(r"addQuestionIfMissing\(questions, \{ id = \"(?P<id>[^\"]+)\"; versionId = \"(?P<vid>[^\"]+)\"; text = \"(?P<text>.*?)\"; options = \[(?P<opts>.*?)\]; correctOptionIndex = (?P<ci>\d+); explanation = \"(?P<ex>.*?)\";", re.S)

    def opts_from_group(s):
        # split on commas that separate quoted strings
        parts = re.findall(r'"(.*?)"', s, re.S)
        return [p.replace('\n',' ').strip() for p in parts]

    new_txt = txt
    changes = 0

    for m in pattern.finditer(txt):
        qid = m.group('id')
        stem = m.group('text').replace('"','\\"')
        opts = opts_from_group(m.group('opts'))
        ci = int(m.group('ci'))
        old_expl = m.group('ex')
        if old_expl.strip() != '':
            continue
        gen = generate_explanation(stem, opts, ci)
        # escape backslashes and double quotes for Motoko string literal
        gen_esc = gen.replace('\\','\\\\').replace('"','\\"')
        # limit explanation length to avoid extremely long lines
        if len(gen_esc) > 1000:
            gen_esc = gen_esc[:1000] + '...'
        new_fragment = m.group(0).replace('explanation = ""', f'explanation = "{gen_esc}"')
        new_txt = new_txt.replace(m.group(0), new_fragment, 1)
        changes += 1

    if changes == 0:
        print('No empty explanations found or no changes applied.')
    else:
        SEED_PATH.write_text(new_txt, encoding='utf-8')
        print(f'Injected explanations for {changes} questions into {SEED_PATH}')

if __name__ == '__main__':
    main()
