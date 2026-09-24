"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const slug=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,"");
const source=(id,url,authority="simple_public_site")=>({source_id:id,source_type:"public_web_snapshot",source_url:url,authority});
const clientsText=()=>fs.readFileSync(path.join(ROOT,"data/simple/pages/clientes.md"),"utf8");
function clients(){const body=clientsText().split("Marcas y organizaciones mostradas públicamente en la página de clientes:")[1].split("## Nota")[0];return body.split("\n").filter(x=>x.startsWith("- ")).map(x=>({client_id:slug(x.slice(2).trim()),label:x.slice(2).trim()}));}
function works(){return read("data/simple/trabajos.json").works.map(w=>({work_id:"WORK_"+String(w.id).padStart(3,"0"),client_id:slug(w.client),client:w.client,title:w.title,youtube_url:w.youtube_url,source_url:w.source_url}));}
function industryClientIds(ids){const maps=read("config/scope-maps.json").maps.INDUSTRY.entries;const set=new Set();for(const id of ids||[]){const e=maps.find(x=>x.id===id);if(!e) throw Object.assign(new Error("Unknown INDUSTRY id: "+id),{code:"INVALID_SCOPE"});e.client_ids.forEach(x=>set.add(x));}return set;}
function validateKeys(scope,allowed){for(const k of Object.keys(scope||{}))if(!allowed.includes(k))throw Object.assign(new Error("Unsupported scope field: "+k),{code:"INVALID_SCOPE"});}
function profile(scope){validateKeys(scope,["section"]);const section=scope.section;const allowed=["IDENTITY","TEAM","CAPABILITIES","POSITIONING","ASSOCIATIONS"];if(section&&!allowed.includes(section))throw Object.assign(new Error("Invalid section"),{code:"INVALID_SCOPE"});
 const all={
 IDENTITY:[{founded:2011,definition:"Agencia creativa full servicio, on-off e independiente",team_size_declared:97}],
 TEAM:[{name:"Tomás Sánchez A.",role:"CEO"},{name:"Francisco Cardemil",role:"Director General de Cuentas"},{name:"Tony Sarroca",role:"Director Creativo General"}],
 CAPABILITIES:[{areas:["Agencia creativa full servicio","Diseño","Digital / estrategia","Medios","Trade","Consultoría de marca estratégica y data driven"]}],
 POSITIONING:[{statement:"Pone las ideas primero y busca generar resultados para clientes y marcas."}],
 ASSOCIATIONS:[{name:"IAB — Interactive Advertising Bureau"},{name:"Achap / Cámara de Empresas Creativas de Chile"}]};
 const records=section?all[section]:Object.entries(all).map(([section,records])=>({section,records}));
 return {records,evidence:[source("NOSOTROS","https://simplechile.com/web/nosotros")]};}
function clientList(scope){validateKeys(scope,["client_ids"]);let rows=clients();if(scope.client_ids){const valid=new Set(rows.map(x=>x.client_id));for(const id of scope.client_ids)if(!valid.has(id))throw Object.assign(new Error("Unknown CLIENT id: "+id),{code:"INVALID_SCOPE"});rows=rows.filter(x=>scope.client_ids.includes(x.client_id));}return{records:rows,evidence:[source("CLIENTES","https://simplechile.com/web/clientes")]};}
function clientRelation(scope){validateKeys(scope,["client_id"]);if(!scope.client_id)throw Object.assign(new Error("client_id is required"),{code:"INVALID_SCOPE"});const rows=clients(),row=rows.find(x=>x.client_id===scope.client_id);if(!row)throw Object.assign(new Error("Unknown CLIENT id: "+scope.client_id),{code:"INVALID_SCOPE"});return{records:[{...row,published_as_client:true}],evidence:[source("CLIENTES","https://simplechile.com/web/clientes")]};}
function portfolio(scope){validateKeys(scope,["client_ids","work_ids","industry_ids"]);let rows=works();const allClients=new Set(clients().map(x=>x.client_id));works().forEach(x=>allClients.add(x.client_id));
 if(scope.client_ids){for(const id of scope.client_ids)if(!allClients.has(id))throw Object.assign(new Error("Unknown CLIENT id: "+id),{code:"INVALID_SCOPE"});rows=rows.filter(x=>scope.client_ids.includes(x.client_id));}
 if(scope.work_ids){const valid=new Set(works().map(x=>x.work_id));for(const id of scope.work_ids)if(!valid.has(id))throw Object.assign(new Error("Unknown WORK id: "+id),{code:"INVALID_SCOPE"});rows=rows.filter(x=>scope.work_ids.includes(x.work_id));}
 if(scope.industry_ids){const ids=industryClientIds(scope.industry_ids);rows=rows.filter(x=>ids.has(x.client_id));}
 return{records:rows,evidence:[source("IDEAS","https://simplechile.com/web/ideas"),...(scope.industry_ids?[source("INDUSTRY_MAP","config/scope-maps.json","editorial_v0.1")]:[])]};}
const handlers={AGENCY_PROFILE:profile,CLIENT_RELATION:clientRelation,CLIENT_LIST:clientList,PORTFOLIO:portfolio};
function execute({request_id,capability,scope={}}){if(!request_id||!capability)return fail(request_id,capability,scope,"INVALID_SCOPE","MISSING_REQUIRED","request_id and capability are required");const fn=handlers[capability];if(!fn)return fail(request_id,capability,scope,"NOT_APPLICABLE","CAPABILITY_NOT_IMPLEMENTED","Capability has no engine yet");
 try{const r=fn(scope),status=r.records.length?"OK":"NO_DATA";return envelope(request_id,capability,scope,status,r.records,r.evidence,[]);}
 catch(e){return fail(request_id,capability,scope,e.code==="INVALID_SCOPE"?"INVALID_SCOPE":"NOT_APPLICABLE","EXECUTION_REJECTED",e.message);}}
function envelope(request_id,capability,scope,status,records,evidence,limitations){return{protocol_version:"0.1",request_id,execution_id:"exec_"+crypto.randomUUID(),capability,scope,status,result:{scope,records,evidence},context:null,limitations};}
function fail(r,c,s,status,code,message){return envelope(r||"",c||"",s||{},status,[],[],[{code,message}]);}
module.exports={execute,clients,works,slug};
