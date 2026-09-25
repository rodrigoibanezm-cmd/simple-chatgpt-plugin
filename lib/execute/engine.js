"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const ROOT=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const slug=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,"");
const source=(id,url,authority="simple_public_site")=>({source_id:id,source_type:"public_web_snapshot",source_url:url,authority});
const clientsText=()=>fs.readFileSync(path.join(ROOT,"data/simple/pages/clientes.md"),"utf8");
function clients(){const body=clientsText().split("Marcas y organizaciones mostradas públicamente en la página de clientes:")[1].split("## Nota")[0],assets=read("data/simple/client-assets.json").clients,workRows=works(),byClient=new Map(),industryEntries=read("config/scope-maps.json").maps.INDUSTRY.entries,industryByClient=new Map();for(const w of workRows){if(!byClient.has(w.client_id))byClient.set(w.client_id,[]);byClient.get(w.client_id).push({work_id:w.work_id,title:w.title,youtube_url:w.youtube_url,source_url:w.source_url});}for(const industry of industryEntries)for(const client_id of industry.client_ids||[])if(!industryByClient.has(client_id))industryByClient.set(client_id,{industry_id:industry.id,industry_label:industry.label});return body.split("\n").filter(x=>x.startsWith("- ")).map(x=>{const label=x.slice(2).trim(),client_id=slug(label),published_works=byClient.get(client_id)||[],industry=industryByClient.get(client_id)||{industry_id:"OTHER",industry_label:"Otros"};return{client_id,label,logo_url:assets[client_id]?.logo_url||null,industry_id:industry.industry_id,industry_label:industry.industry_label,published_works};});}
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
function manifesto(scope){validateKeys(scope,[]);const m=read("data/simple/manifiesto.json");return{records:[{tagline:m.tagline,statements:m.statements,brand_assets:m.brand_assets}],evidence:[source("MANIFIESTO",m.source_url)]};}
function clientList(scope){validateKeys(scope,["client_ids"]);let rows=clients();if(scope.client_ids){const valid=new Set(rows.map(x=>x.client_id));for(const id of scope.client_ids)if(!valid.has(id))throw Object.assign(new Error("Unknown CLIENT id: "+id),{code:"INVALID_SCOPE"});rows=rows.filter(x=>scope.client_ids.includes(x.client_id));}return{records:rows,evidence:[source("CLIENTES","https://simplechile.com/web/clientes")]};}
function clientRelation(scope){validateKeys(scope,["client_id"]);if(!scope.client_id)throw Object.assign(new Error("client_id is required"),{code:"INVALID_SCOPE"});const rows=clients(),row=rows.find(x=>x.client_id===scope.client_id);if(!row)throw Object.assign(new Error("Unknown CLIENT id: "+scope.client_id),{code:"INVALID_SCOPE"});return{records:[{...row,published_as_client:true}],evidence:[source("CLIENTES","https://simplechile.com/web/clientes")]};}
function portfolio(scope){validateKeys(scope,["client_ids","work_ids","industry_ids"]);let rows=works();const allClients=new Set(clients().map(x=>x.client_id));works().forEach(x=>allClients.add(x.client_id));
 if(scope.client_ids){for(const id of scope.client_ids)if(!allClients.has(id))throw Object.assign(new Error("Unknown CLIENT id: "+id),{code:"INVALID_SCOPE"});rows=rows.filter(x=>scope.client_ids.includes(x.client_id));}
 if(scope.work_ids){const valid=new Set(works().map(x=>x.work_id));for(const id of scope.work_ids)if(!valid.has(id))throw Object.assign(new Error("Unknown WORK id: "+id),{code:"INVALID_SCOPE"});rows=rows.filter(x=>scope.work_ids.includes(x.work_id));}
 if(scope.industry_ids){const ids=industryClientIds(scope.industry_ids);rows=rows.filter(x=>ids.has(x.client_id));}
 return{records:rows,evidence:[source("IDEAS","https://simplechile.com/web/ideas"),...(scope.industry_ids?[source("INDUSTRY_MAP","config/scope-maps.json","editorial_v0.1")]:[])]};}
function credentials(scope){validateKeys(scope,["credential_type"]);const type=scope.credential_type||"ALL",valid=["AWARD","RECOGNITION","ASSOCIATION","ALL"];if(!valid.includes(type))throw Object.assign(new Error("Invalid credential_type"),{code:"INVALID_SCOPE"});
 const awards=["Effies","Cannes","Fiap","El Ojo de Iberoamérica","Clio’s","Andy’s","D&AD","ADC","LIAA","One Show","New York Festivals","El Sol","Lápiz de Platino","Fice","Fepi","Wina","Achap","IAB Mix"].map(name=>({credential_type:"AWARD",name}));
 const recognitions=["Mejor Agencia Creativa Independiente Achap","Mejor Agencia Creativa Independiente Cannes","Mejor Agencia Creativa Chile Fiap","Mejor Agencia Creativa Independiente El Ojo","Mejor Agencia Creativa Independiente del Mundo en Wina Festival"].map(name=>({credential_type:"RECOGNITION",name}));
 const associations=["IAB — Interactive Advertising Bureau","Achap / Cámara de Empresas Creativas de Chile"].map(name=>({credential_type:"ASSOCIATION",name}));
 const all=[...awards,...recognitions,...associations],records=type==="ALL"?all:all.filter(x=>x.credential_type===type);
 return{records,evidence:[source("NOSOTROS","https://simplechile.com/web/nosotros")]};}
function consumerInsights(scope){validateKeys(scope,["insight_ids","topic_ids"]);const facts=read("data/simple/consumidores.json").facts;
 let rows=facts.map(f=>({insight_id:"CI_"+String(f.id).padStart(3,"0"),statement:f.statement,attributed_source:f.source,page:f.page,source_url:f.source_url,historical:true}));
 const valid=new Set(rows.map(x=>x.insight_id));if(scope.insight_ids){for(const id of scope.insight_ids)if(!valid.has(id))throw Object.assign(new Error("Unknown CONSUMER_INSIGHT id: "+id),{code:"INVALID_SCOPE"});rows=rows.filter(x=>scope.insight_ids.includes(x.insight_id));}
 if(scope.topic_ids){const entries=read("config/scope-maps.json").maps.CONSUMER_TOPIC.entries,set=new Set();for(const id of scope.topic_ids){const e=entries.find(x=>x.id===id);if(!e)throw Object.assign(new Error("Unknown CONSUMER_TOPIC id: "+id),{code:"INVALID_SCOPE"});e.insight_ids.forEach(x=>set.add(x));}rows=rows.filter(x=>set.has(x.insight_id));}
 return{records:rows,evidence:[source("CONSUMERS","https://simplechile.com/web/los-consumidores"),...(scope.topic_ids?[source("CONSUMER_TOPIC_MAP","config/scope-maps.json","editorial_v0.1")]:[])],limitations:[{code:"HISTORICAL_SOURCE","message":"Consumer statements are historical published material and must not be represented as current market facts."}]};}
const contacts=[
 {specialty_id:"FULL_SERVICE",specialty:"Agencia creativa full servicio",email:"tomas.sanchez@simplechile.com"},
 {specialty_id:"DESIGN",specialty:"Diseño",email:"fabrizio.capraro@simplechile.com"},
 {specialty_id:"DIGITAL_STRATEGY",specialty:"Digital / estrategia",email:"francisco.cardemil@simplechile.com"},
 {specialty_id:"MEDIA",specialty:"Medios",email:"paola.guajardo@simplemediachile.com"},
 {specialty_id:"TRADE",specialty:"Trade",email:"fabrizio.capraro@simplechile.com"},
 {specialty_id:"BRAND_CONSULTING",specialty:"Consultoría de marca estratégica y data driven",email:"francisco.cardemil@simplechile.com"}
];
function contactDirectory(scope){validateKeys(scope,["specialty_id"]);let rows=contacts;if(scope.specialty_id){if(!contacts.some(x=>x.specialty_id===scope.specialty_id))throw Object.assign(new Error("Unknown SPECIALTY id: "+scope.specialty_id),{code:"INVALID_SCOPE"});rows=contacts.filter(x=>x.specialty_id===scope.specialty_id);}
 return{records:rows,evidence:[source("NOSOTROS","https://simplechile.com/web/nosotros"),source("CONTACTO","https://simplechile.com/web/contacto")]};}
const handlers={AGENCY_PROFILE:profile,MANIFESTO:manifesto,CLIENT_RELATION:clientRelation,CLIENT_LIST:clientList,PORTFOLIO:portfolio,CREDENTIALS:credentials,CONSUMER_INSIGHTS:consumerInsights,CONTACT_DIRECTORY:contactDirectory};
function execute({request_id,capability,scope={}}){if(!request_id||!capability)return fail(request_id,capability,scope,"INVALID_SCOPE","MISSING_REQUIRED","request_id and capability are required");const fn=handlers[capability];if(!fn)return fail(request_id,capability,scope,"NOT_APPLICABLE","CAPABILITY_NOT_IMPLEMENTED","Capability has no engine yet");
 try{const r=fn(scope),status=r.records.length?"OK":"NO_DATA";return envelope(request_id,capability,scope,status,r.records,r.evidence,r.limitations||[]);}
 catch(e){return fail(request_id,capability,scope,e.code==="INVALID_SCOPE"?"INVALID_SCOPE":"NOT_APPLICABLE","EXECUTION_REJECTED",e.message);}}
function envelope(request_id,capability,scope,status,records,evidence,limitations){return{protocol_version:"0.1",request_id,execution_id:"exec_"+crypto.randomUUID(),capability,scope,status,result:{scope,records,evidence},context:null,limitations};}
function fail(r,c,s,status,code,message){return envelope(r||"",c||"",s||{},status,[],[],[{code,message}]);}
module.exports={execute,clients,works,slug};
