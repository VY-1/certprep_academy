PTCB ORG Exam Seeding
======================

This document explains how to extract questions from a PDF, transform them, and seed them into the backend canister.

1) Extract questions from the PDF

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install pdfplumber regex tqdm
python tools/extract_ptcb_pdf.py --input "/Users/big-v/Downloads/Ptcb exam/ptcb_exam_questions_only.pdf" --output data/ptcb_questions_raw.json
```

2) Transform to backend schema

```bash
python tools/transform_questions_to_backend.py --input data/ptcb_questions_raw.json --output data/ptcb_questions_backend.json
```

3) Deploy or build backend and expose an admin seeding endpoint (recommended). After canisters are deployed to local replica, seed using:

```bash
node scripts/run_seed.js --canister <BACKEND_CANISTER_ID> data/ptcb_questions_backend.json
```

If you don't have an admin HTTP endpoint, `scripts/run_seed.js` will print a curl command you can adapt to your environment. Alternatively, you can implement a Motoko admin method to accept JSON and insert records.

Notes
- This process is heuristic and will require a manual review of `data/ptcb_questions_raw.json` before seeding.
- We omit images/diagrams by default.
