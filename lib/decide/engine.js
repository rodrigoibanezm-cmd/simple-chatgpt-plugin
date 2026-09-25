"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const ROOT=process.cwd(); const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const slug=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,"");
function derivedMaps(){const clientMd=fs.readFileSync(path.join(ROOT,"data/simple/pages/clientes.md"),"utf8");const body=clientMd.split("Marcas y organizaciones mostradas públicamente en la página de clientes:")[1].split("## Nota")[0];const clients=body.split("\n").filter(x=>x.startsWith("- ")).map(x=>x.slice(2).trim());const works=read("data/simple/trabajos.json").works;for(const w of works)if(!clients.includes(w.client))clients.push(w.client);
 const facts=read("data/simple/consumidores.json").facts;
 return {
 CLIENT:clients.map(label=>({id:slug(label),label})),
 WORK:works.map(w=>({id:"WORK_"+String(w.id).padStart(3,"0"),label:w.client+" — "+w.title,aliases:[w.title]})),
 CONSUMER_INSIGHT:facts.map(f=>({id:"CI_"+String(f.id).padStart(3,"0"),label:f.statement})),
 SPECIALTY:[
 {id:"FULL_SERVICE",label:"Agencia creativa full servicio",aliases:["creatividad","agencia"]},
 {id:"DESIGN",label:"Diseño",aliases:["diseño"]},{id:"DIGITAL_STRATEGY",label:"Digital / estrategia",aliases:["digital","estrategia"]},
 {id:"MEDIA",label:"Medios",aliases:["medios","media"]},{id:"TRADE",label:"Trade",aliases:["trade"]},
 {id:"BRAND_CONSULTING",label:"Consultoría de marca estratégica y data driven",aliases:["consultoría","marca","data driven"]}
 ]};}
function decide({intention,modifiers=[],scope_maps=[]}){const intents=read("config/intent-registry.json").intentions,registry=read("config/capability-registry.json"),caps=registry.capabilities;if(!intents[intention]){const request_id="decide_"+crypto.randomUUID();return{protocol_version:"0.1",request_id,intention:"UNKNOWN",modifiers,capabilities:[],scope_maps:{},continuations:[],limitations:[{code:"INVALID_INTENTION",message:"Unknown intention"}]};}
 const maps={...derivedMaps(),...read("config/scope-maps.json").maps},returned={};const limitations=[];
 for(const name of scope_maps){const m=maps[name];if(!m){limitations.push({code:"UNKNOWN_SCOPE_MAP",message:"Unknown scope map: "+name});continue;}const entries=Array.isArray(m)?m:m.entries;if(!Array.isArray(entries)){limitations.push({code:"INVALID_SCOPE_MAP",message:"Invalid scope map structure: "+name});continue;}returned[name]=entries.map(e=>({id:e.id,label:e.label,...(e.aliases?{aliases:e.aliases}:{})}));}
 let offered=Object.entries(caps).filter(([,c])=>c.intentions.includes(intention)).map(([id,c])=>({id,description:c.description,evidence_semantics:c.evidence_semantics,input_contract:c.input_contract,output_contract:c.output_contract}));
 if(modifiers.includes("TIMING"))limitations.push({code:"TIMING_NOT_CERTIFIED",message:"Current public evidence does not certify current-market timing claims."});
 const continuations=[];
 if(intention==="WHY_SIMPLE"||intention==="FIT")continuations.push({type:"SCOPE_REFINEMENT",scope_map:"INDUSTRY",purpose:"Refine the next turn to the prospect's industry so evidence can be bounded to relevant Simple experience."});
 if(intention==="CONTACT")continuations.push({type:"SCOPE_REFINEMENT",scope_map:"SPECIALTY",purpose:"Identify the contact specialty so the next execution can return the relevant published contact route."});
 for(const continuation of continuations){const name=continuation.scope_map;if(returned[name])continue;const m=maps[name];if(!m){limitations.push({code:"UNKNOWN_CONTINUATION_SCOPE_MAP",message:"Continuation requires unknown scope map: "+name});continue;}const entries=Array.isArray(m)?m:m.entries;if(!Array.isArray(entries)){limitations.push({code:"INVALID_CONTINUATION_SCOPE_MAP",message:"Continuation scope map has invalid structure: "+name});continue;}returned[name]=entries.map(e=>({id:e.id,label:e.label,...(e.aliases?{aliases:e.aliases}:{})}));}
 const request_id="decide_"+crypto.randomUUID();
 return{protocol_version:"0.1",request_id,intention,modifiers,selection_guidance:{principles:registry.selection_principles||[],examples:registry.selection_examples||[]},capabilities:offered,scope_maps:returned,continuations,limitations};}
module.exports={decide};
