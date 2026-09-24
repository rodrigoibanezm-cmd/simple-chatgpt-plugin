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
function decide({intention,modifiers=[],scope_maps=[]}){const intents=read("config/intent-registry.json").intentions,caps=read("config/capability-registry.json").capabilities;if(!intents[intention])return{protocol_version:"0.1",request_id:"decide_"+crypto.randomUUID(),intention:"UNKNOWN",modifiers,capabilities:[],scope_maps:{},limitations:[{code:"INVALID_INTENTION",message:"Unknown intention"}]};
 const maps={...derivedMaps(),...read("config/scope-maps.json").maps},returned={};const limitations=[];
 for(const name of scope_maps){const m=maps[name];if(!m){limitations.push({code:"UNKNOWN_SCOPE_MAP",message:"Unknown scope map: "+name});continue;}returned[name]=(m.entries||m).map(e=>({id:e.id,label:e.label,...(e.aliases?{aliases:e.aliases}:{})}));}
 let offered=Object.entries(caps).filter(([,c])=>c.intentions.includes(intention)).map(([id,c])=>({id,description:c.description,scope_contract:c.scope_contract}));
 if(modifiers.includes("TIMING"))limitations.push({code:"TIMING_NOT_CERTIFIED",message:"Current public evidence does not certify current-market timing claims."});
 const continuations=[];
 if((intention==="WHY_SIMPLE"||intention==="FIT")&&!scope_maps.includes("INDUSTRY"))continuations.push({type:"SCOPE_REFINEMENT",scope_map:"INDUSTRY",purpose:"Refine the next turn to the prospect's industry so evidence can be bounded to relevant Simple experience."});
 return{protocol_version:"0.1",request_id:"decide_"+crypto.randomUUID(),intention,modifiers,capabilities:offered,scope_maps:returned,continuations,limitations};}
module.exports={decide};
