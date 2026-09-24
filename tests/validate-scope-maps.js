#!/usr/bin/env node
const fs=require("fs"),path=require("path"); const root=path.resolve(__dirname,"..");
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const maps=read("config/scope-maps.json"), works=read("data/simple/trabajos.json"), insights=read("data/simple/consumidores.json");
const fail=[];
const workClients=new Set(works.works.map(x=>x.client.toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,"")));
const insightIds=new Set(insights.facts.map(x=>"CI_"+String(x.id).padStart(3,"0")));
for(const e of maps.maps.INDUSTRY.entries){ if(!e.id||!e.label) fail.push("Invalid INDUSTRY entry"); }
for(const e of maps.maps.CONSUMER_TOPIC.entries){ for(const id of e.insight_ids) if(!insightIds.has(id)) fail.push("Unknown insight "+id+" in "+e.id); }
const online=maps.maps.CONSUMER_TOPIC.entries.find(x=>x.id==="ONLINE_SHOPPING");
for(const id of ["CI_001","CI_005","CI_010"]) if(!online?.insight_ids.includes(id)) fail.push("ONLINE_SHOPPING missing "+id);
if(fail.length){console.error("Scope map tests FAILED"); fail.forEach(x=>console.error("- "+x)); process.exit(1);}
console.log("Scope map tests PASS: INDUSTRY and CONSUMER_TOPIC maps are structurally valid");
