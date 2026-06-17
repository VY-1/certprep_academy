#!/usr/bin/env python3
import re
import sys
from pathlib import Path

arg_path = Path("artifacts/ptcb_update_20260527/ptcb_questions_upsert_from_pdf.arg")
out_path = Path("/tmp/embedded_payload_generated.mo")
if not arg_path.exists():
    print(f"ARG file not found: {arg_path}")
    sys.exit(1)
text = arg_path.read_text()

# Global transforms on the whole file
# 1) convert options vec { ... } to Motoko array [ ... ]
def options_repl(m):
    inner = m.group(1)
    items = [it.strip() for it in inner.split(';') if it.strip()]
    # keep original quoting
    return 'options = [' + ', '.join(items) + '];'

# First, mark the options start to reliably grab the whole block even if formatting varies
text_marked = re.sub(r'options\s*=\s*vec\s*\{', 'OPTIONS_START<<<', text, flags=re.DOTALL)

# Now replace each OPTIONS_START...}; with a Motoko array
def options_marked_repl(m):
    inner = m.group(1)
    items = [it.strip() for it in inner.split(';') if it.strip()]
    return 'options = [' + ', '.join(items) + '];'

text2 = re.sub(r'OPTIONS_START<<<(.*?)\};', options_marked_repl, text_marked, flags=re.DOTALL)

# 2) convert knowledgeDomain variant to #Other("...")
text2 = re.sub(r'knowledgeDomain\s*=\s*variant\s*\{\s*Other\s*=\s*"(.*?)"\s*\};', r'knowledgeDomain = #Other("\1");', text2, flags=re.DOTALL)

# 3) remove explicit : nat annotations
text2 = re.sub(r'correctOptionIndex\s*=\s*(\d+)\s*:\s*nat\s*;', r'correctOptionIndex = \1;', text2)

# Extract record blocks
records = re.findall(r'record\s*\{(.*?)\};', text2, flags=re.DOTALL)
converted = []
for rec in records:
    r = rec.strip()
    # normalize spacing and ensure semicolons
    r = re.sub(r'\s+;', ';', r)
    converted.append('{ ' + r + ' }')

module_text = 'import Types "../types/exams";\n\nmodule {\n  public func embeddedPtcbPayload() : [Types.Question] {\n    return [\n'
module_text += ',\n'.join('      ' + c for c in converted)
module_text += '\n    ];\n  }\n}\n'

out_path.write_text(module_text)
print(f'Wrote {out_path}')
