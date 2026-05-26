#!/usr/bin/env node
// Simple helper to POST a backend-formatted questions JSON to a local admin endpoint.
// Usage:
//   node scripts/run_seed.js --canister t63gs-up777-77776-aaaba-cai data/ptcb_questions_backend.json

import fs from "fs";
import path from "path";

const argv = process.argv.slice(2);
if (argv.length < 2) {
  console.log("Usage: node scripts/run_seed.js --canister <CANISTER_ID> <questions.json>");
  process.exit(1);
}

let canister = null;
let file = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--canister") {
    canister = argv[i + 1];
    i++;
  } else {
    file = argv[i];
  }
}

if (!file) {
  console.error("Missing questions JSON file");
  process.exit(2);
}

const payload = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));

if (!canister) {
  console.log("No --canister provided. Showing example curl command to POST to local replica admin endpoint:");
  console.log("");
  console.log(`curl -X POST -H 'Content-Type: application/json' --data-binary @${file} http://<CANISTER_ID>.localhost:8000/admin/seed`);
  process.exit(0);
}

const url = `http://${canister}.localhost:8000/admin/seed`;

(async () => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log(`POST ${url} -> ${res.status}`);
    console.log(text);
  } catch (e) {
    console.error("Error sending seed request:", e);
    console.log("");
    console.log("If the admin endpoint is not available, you can instead add a Motoko admin method or use the canister's REPL to insert data.");
  }
})();
