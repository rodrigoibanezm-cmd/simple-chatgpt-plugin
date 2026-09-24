#!/usr/bin/env node
const fs=require("fs"),path=require("path");const root=path.resolve(__dirname,"..");
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const input=read("schemas/execute-input.schema.json"), output=read("schemas/execute-output.schema.json"), caps=read("config/capability-registry.json"), tests=read("tests/execute-contract-cases.json");
const fail=[]; const capIds=Object.keys(caps.capabilities); const inputCaps=input.properties.capability.enum;
for(const c of capIds) if(!inputCaps.includes(c)) fail.push("EXECUTE input missing capability "+c);
for(const c of inputCaps) if(!capIds.includes(c)) fail.push("EXECUTE input exposes unknown capability "+c);
for(const k of ["request_id","decision_token","capability","scope"]) if(!input.required.includes(k)) fail.push("EXECUTE input must require "+k);
for(const k of ["request_id","execution_id","capability","scope","status","result","context","limitations"]) if(!output.required.includes(k)) fail.push("EXECUTE output must require "+k);
const statuses=new Set(output.properties.status.enum);
for(const tc of tests.cases) if(!statuses.has(tc.expected_status)) fail.push(tc.id+": unknown expected status "+tc.expected_status);
if(!output.properties.context.description.includes("temporal")) fail.push("CONTEXT contract must explicitly constrain temporal relaxation");
if(fail.length){console.error("EXECUTE contract tests FAILED");fail.forEach(x=>console.error("- "+x));process.exit(1);}
console.log("EXECUTE contract tests PASS: "+tests.cases.length+" invariants");
