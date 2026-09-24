#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const intents = read("config/intent-registry.json");
const caps = read("config/capability-registry.json");
const input = read("schemas/decide-input.schema.json");
const output = read("schemas/decide-output.schema.json");
const suite = read("tests/decide-contract-cases.json");

const failures = [];
const intentSet = new Set(Object.keys(intents.intentions));
const inputIntents = new Set(input.properties.intention.enum);
const outputIntents = new Set(output.properties.intention.enum);
const mapSet = new Set(input.properties.scope_maps.items.enum);
const capSet = new Set(Object.keys(caps.capabilities));

for (const i of intentSet) {
  if (!inputIntents.has(i)) failures.push(`Intent ${i} missing from DECIDE input schema`);
  if (!outputIntents.has(i)) failures.push(`Intent ${i} missing from DECIDE output schema`);
}
for (const tc of suite.cases) {
  if (!intentSet.has(tc.intention)) failures.push(`Case ${tc.id}: unknown intention ${tc.intention}`);
  for (const m of tc.decide.requested_scope_maps) if (!mapSet.has(m)) failures.push(`Case ${tc.id}: unknown scope map ${m}`);
  for (const c of tc.decide.expected_capabilities) {
    if (!capSet.has(c)) { failures.push(`Case ${tc.id}: unknown capability ${c}`); continue; }
    if (!caps.capabilities[c].intentions.includes(tc.intention)) failures.push(`Case ${tc.id}: ${c} is not available for ${tc.intention}`);
  }
}
const counts = suite.cases.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{});
if (suite.cases.length !== suite.summary.total) failures.push("Suite total does not match case count");
for (const k of ["PASS","LIMITED","GAP"]) if ((counts[k]||0) !== suite.summary[k.toLowerCase()]) failures.push(`Summary mismatch for ${k}`);

if (failures.length) {
  console.error("DECIDE contract tests FAILED");
  for (const f of failures) console.error("- " + f);
  process.exit(1);
}
console.log(`DECIDE contract tests PASS: ${suite.cases.length} cases (${counts.PASS} PASS, ${counts.LIMITED} LIMITED, ${counts.GAP} GAP)`);
