#!/usr/bin/env node
const assert=require("assert");const {execute}=require("../lib/execute/engine");
const run=(capability,scope={})=>execute({request_id:"test_decide_request",capability,scope});
let r=run("AGENCY_PROFILE",{section:"IDENTITY"});assert.equal(r.status,"OK");assert.equal(r.result.records[0].founded,2011);assert.equal(r.context,null);
r=run("CLIENT_RELATION",{client_id:"COLUN"});assert.equal(r.status,"OK");assert.equal(r.result.records[0].published_as_client,true);
r=run("CLIENT_LIST",{client_ids:["COLUN","ABASTIBLE"]});assert.equal(r.status,"OK");assert.deepEqual(r.result.records.map(x=>x.client_id).sort(),["ABASTIBLE","COLUN"]);
r=run("PORTFOLIO",{client_ids:["COLUN"]});assert.equal(r.status,"OK");assert.equal(r.result.records.length,3);assert(r.result.records.every(x=>x.client_id==="COLUN"));
r=run("PORTFOLIO",{industry_ids:["AUTOMOTIVE"]});assert.equal(r.status,"OK");assert.equal(r.result.records.length,2);assert(r.result.records.every(x=>x.client_id==="JAC"));
r=run("PORTFOLIO",{client_ids:["RENAULT"]});assert.equal(r.status,"NO_DATA");assert.equal(r.result.records.length,0);
r=run("PORTFOLIO",{client_ids:["NOT_REAL"]});assert.equal(r.status,"INVALID_SCOPE");
r=run("PORTFOLIO",{foo:"bar"});assert.equal(r.status,"INVALID_SCOPE");
r=run("CREDENTIALS",{});assert.equal(r.status,"NOT_APPLICABLE");
console.log("Real EXECUTE engine tests PASS: 9 cases");
