#!/usr/bin/env node
"use strict";
const assert=require("assert");
const {buildContract,validateCreativeBrief}=require("../lib/creative-director/contract");
const cases=require("./fixtures/creative-director-cases.json");

assert.equal(cases.length,10);

for(const c of cases){
  const contract=buildContract({
    user_question:c.question,
    certified_evidence:c.evidence,
    available_assets:c.assets
  });
  assert.equal(contract.role,"creative_director");
  assert.equal(contract.assignment.target_duration_seconds,15);
  assert.deepEqual(contract.input.certified_evidence,c.evidence);

  const valid={
    idea:"Test idea",
    message:"Test message",
    story:[
      {purpose:"open",direction:"Open the story."},
      {purpose:"proof",evidence_refs:c.evidence.slice(0,1),direction:"Use certified proof."},
      {purpose:"close",direction:"Close the story."}
    ]
  };
  assert.deepEqual(validateCreativeBrief(valid,contract),{ok:true,errors:[]});

  const invalid={
    idea:"Test idea",
    message:"Test message",
    story:[{purpose:"proof",evidence_refs:["INVENTED_REF"],direction:"Invent something."}]
  };
  const result=validateCreativeBrief(invalid,contract);
  assert.equal(result.ok,false);
  assert(result.errors.some(x=>x.includes("INVENTED_REF")));
}

console.log("Creative Director v0.1 contract tests PASS: 10 cases");
