#!/usr/bin/env node
"use strict";
const fs=require("fs");
const path=require("path");
const {SYSTEM_PROMPT,buildContract,validateCreativeBrief}=require("../lib/creative-director/contract");
const cases=require("../tests/fixtures/creative-director-cases.json");

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null;}
const caseId=arg("--case");
const briefPath=arg("--brief");
if(!caseId){
  console.error("Usage: node scripts/creative-director-runner.js --case <CASE_ID> [--brief <brief.json>]");
  console.error("Cases: "+cases.map(x=>x.id).join(", "));
  process.exit(1);
}
const selected=cases.find(x=>x.id===caseId);
if(!selected){console.error("Unknown case: "+caseId);process.exit(1);}

const contract=buildContract({
  user_question:selected.question,
  certified_evidence:selected.evidence,
  available_assets:selected.assets
});

const journal={
  case_id:selected.id,
  system_prompt:SYSTEM_PROMPT,
  input:contract,
  raw_llm_output:null,
  validation:null
};

if(briefPath){
  const raw=fs.readFileSync(path.resolve(briefPath),"utf8");
  journal.raw_llm_output=raw;
  try{
    const brief=JSON.parse(raw);
    journal.validation=validateCreativeBrief(brief,contract);
    journal.creative_brief=brief;
  }catch(e){
    journal.validation={ok:false,errors:["invalid JSON: "+e.message]};
  }
}

process.stdout.write(JSON.stringify(journal,null,2)+"\n");
if(journal.validation&&!journal.validation.ok) process.exitCode=2;
