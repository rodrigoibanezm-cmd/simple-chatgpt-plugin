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

const dongfengCases=require("./fixtures/dongfeng-007-cases.json");
assert.equal(dongfengCases.length,3);
for(const c of dongfengCases){
  const contract=buildContract({
    user_question:c.question,
    certified_evidence:c.evidence,
    available_assets:c.assets
  });
  assert.deepEqual(contract.input.certified_evidence,c.evidence);
  assert(contract.input.certified_evidence.every(e=>e.source==="https://cidef.cl/modelo/007/"));
  const valid={
    idea:"One idea",
    message:"One message",
    story:[{purpose:"proof",evidence_refs:[c.evidence[0].id],direction:"Show certified proof."}]
  };
  assert.deepEqual(validateCreativeBrief(valid,contract),{ok:true,errors:[]});
  const invalid={...valid,story:[{...valid.story[0],evidence_refs:["UNVERIFIED_007_CLAIM"]}]};
  assert.equal(validateCreativeBrief(invalid,contract).ok,false);
}
console.log("Creative Director contract tests PASS: 10 Simple + 3 Dongfeng 007 cases");
