"use strict";

const {decide}=require("../lib/decide/engine");
const {execute}=require("../lib/execute/engine");
const {protocolLog}=require("../lib/protocol/log");

const INTENTIONS=["ABOUT","EXPERIENCE","CONSUMER","WHY_SIMPLE","FIT","CONTACT","UNKNOWN"];
const MODIFIERS=["TIMING"];
const MAPS=["CLIENT","WORK","CONSUMER_INSIGHT","SPECIALTY","INDUSTRY","CONSUMER_TOPIC"];
const CAPABILITIES=["AGENCY_PROFILE","CLIENT_RELATION","CLIENT_LIST","CREDENTIALS","CONSUMER_INSIGHTS","CONTACT_DIRECTORY"];
const SIMPLE_WORK_URI="ui://simple/work/v3.html";

const SIMPLE_WORK_HTML=`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}
body{margin:0;background:#f2f0ea;color:#111;font-family:Arial,Helvetica,sans-serif}
.wrap{padding:18px;display:grid;gap:14px}
.eyebrow{font-size:11px;letter-spacing:.16em;text-transform:uppercase}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.card{background:#111;color:#fff;min-height:300px;position:relative;overflow:hidden;border-radius:2px;cursor:pointer}
.card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;filter:saturate(.9)}
.copy{padding:16px 16px 18px}
.client{font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.68;margin-bottom:7px}
.title{font-size:30px;line-height:.95;font-weight:700;letter-spacing:-.04em}
.link{margin-top:22px;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.empty{padding:24px;background:#fff}
</style>
</head>
<body>
<div class="wrap">
  <div class="eyebrow">Ideas / Simple Chile</div>
  <div id="grid" class="grid"><div class="empty">Cargando trabajos…</div></div>
</div>
<script>
(function(){
  var pending=new Map(),nextId=1,latest={works:[]},initialized=false;

  function esc(v){return String(v??"").replace(/[&<>"']/g,function(ch){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[ch]})}
  function youtubeId(url){try{return new URL(url).searchParams.get("v")||""}catch(e){return""}}
  function request(method,params){
    var id=nextId++;
    window.parent.postMessage({jsonrpc:"2.0",id:id,method:method,params:params},"*");
    return new Promise(function(resolve,reject){pending.set(id,{resolve:resolve,reject:reject})});
  }
  function notify(method,params){
    window.parent.postMessage({jsonrpc:"2.0",method:method,params:params||{}},"*");
  }
  function openLink(href){
    if(window.openai&&window.openai.openExternal){window.openai.openExternal({href:href});return}
    window.open(href,"_blank","noopener,noreferrer");
  }
  function render(data){
    latest=data||{works:[]};
    var rows=Array.isArray(latest.works)?latest.works:[];
    var grid=document.getElementById("grid");
    if(!rows.length){grid.innerHTML='<div class="empty">No hay trabajos para mostrar.</div>';return}
    grid.innerHTML=rows.slice(0,4).map(function(w){
      var id=youtubeId(w.youtube_url);
      var img=id?"https://i.ytimg.com/vi/"+encodeURIComponent(id)+"/hqdefault.jpg":"";
      return '<article class="card" data-index="'+rows.indexOf(w)+'">'+
        (img?'<img src="'+img+'" alt="">':'')+
        '<div class="copy"><div class="client">'+esc(w.client)+'</div>'+
        '<div class="title">'+esc(w.title)+'</div>'+
        '<div class="link">Ver trabajo →</div></div></article>';
    }).join("");
    document.querySelectorAll(".card").forEach(function(el){
      el.addEventListener("click",function(){
        var w=rows[Number(el.dataset.index)];
        if(w&&w.youtube_url)openLink(w.youtube_url);
      });
    });
  }

  window.addEventListener("message",function(event){
    if(event.source!==window.parent)return;
    var message=event.data;
    if(!message||message.jsonrpc!=="2.0")return;

    if(message.id!==undefined&&pending.has(message.id)){
      var p=pending.get(message.id);pending.delete(message.id);
      if(message.error)p.reject(message.error);else p.resolve(message.result);
      return;
    }
    if(message.method==="ui/notifications/tool-result"){
      render(message.params&&message.params.structuredContent);
    }
  },{passive:true});

  request("ui/initialize",{
    protocolVersion:"2026-01-26",
    appCapabilities:{},
    appInfo:{name:"simple-work",title:"Simple Chile — Ideas",version:"1.0.0"}
  }).then(function(){
    initialized=true;
    notify("ui/notifications/initialized",{});
  }).catch(function(){
    var fallback=window.openai&&window.openai.toolOutput;
    if(fallback)render(fallback);
  });

  if(window.openai&&window.openai.toolOutput)render(window.openai.toolOutput);
})();
</script>
</body>
</html>`;

const SERVER_INSTRUCTIONS=`For questions about Simple Chile, call decide first with the semantic intention and any canonical scope maps needed. Use the returned capability input/output contracts and canonical maps to choose a capability and construct its scope, then call execute with the same request_id. Do not invent canonical IDs. Do not recalculate backend-owned results. Use returned evidence and limitations when answering. When decide offers PORTFOLIO and portfolio evidence is needed, call execute_portfolio instead of execute. execute_portfolio is the portfolio UI tool and renders the work directly.

You are Simple Chile speaking directly with a potential client.

IDENTITY
- Who: Una agencia creativa independiente chilena.
- Does: Crea ideas y experiencias de marca que conectan con las personas.
- Value: Hacer simple lo complejo.

EDITORIAL PRINCIPLE
Si puede decirse más simple, todavía no está listo.

VOICE
Directa. Breve. Humana. Ingeniosa. Segura.

RULES
- Partir por la idea o respuesta, no por la explicación.
- Una idea por bloque.
- Usar palabras comunes.
- Preferir frases cortas.
- Mostrar evidencia después de la idea.
- Usar juegos de palabras solo cuando sean naturales.
- Ser comercialmente curioso: entender qué quiere lograr la persona y mover la conversación hacia adelante.
- Preferir ejemplos y prueba concreta sobre descripciones institucionales.

NEVER
- No introducciones genéricas de asistente.
- No repetir la pregunta.
- No prosa corporativa.
- No explicar lo evidente.
- No cierres redundantes ni resúmenes de lo ya dicho.
- No frases típicas de ChatGPT como "para una empresa como la tuya".
- No bloques largos de prosa salvo que el usuario los pida.
- Nunca inventar hechos fuera de la evidencia certificada.

PRESENTATION
- La respuesta debe verse distinta a una respuesta típica de ChatGPT.
- Abrir con una frase fuerte o el dato principal.
- Párrafos de 1-2 líneas.
- Mucho espacio visual.
- Usar negritas solo para ideas y datos clave.
- Encabezados de 1-4 palabras cuando ayuden.
- Listas cortas, solo si simplifican.
- Tablas solo cuando comparar lo exija.
- Terminar cuando la respuesta esté completa. Sin despedida.
- Extensión: la mínima necesaria.

If a continuation is useful and unresolved, ask it naturally and briefly.`;

module.exports=async(req,res)=>{
  if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});

  const [{McpServer},{StreamableHTTPServerTransport},{registerAppResource,registerAppTool,RESOURCE_MIME_TYPE},{z}]=await Promise.all([
    import("@modelcontextprotocol/sdk/server/mcp.js"),
    import("@modelcontextprotocol/sdk/server/streamableHttp.js"),
    import("@modelcontextprotocol/ext-apps/server"),
    import("zod")
  ]);

  const server=new McpServer(
    {name:"simple-chile",version:"0.1.0"},
    {instructions:SERVER_INSTRUCTIONS}
  );

  registerAppResource(server,"simple-work",SIMPLE_WORK_URI,{},async()=>({
    contents:[{
      uri:SIMPLE_WORK_URI,
      mimeType:RESOURCE_MIME_TYPE,
      text:SIMPLE_WORK_HTML,
      _meta:{
        ui:{
          prefersBorder:false,
          csp:{resourceDomains:["https://i.ytimg.com"]}
        }
      }
    }]
  }));

  server.registerTool("decide",{
    title:"Discover Simple capabilities",
    description:"First step for questions about Simple Chile. Discover the backend capabilities, their input/output contracts, canonical maps, limitations and useful continuations for the user's semantic intention. Call this before execute.",
    inputSchema:{
      intention:z.enum(INTENTIONS).describe("Semantic intention inferred from the user's question."),
      modifiers:z.array(z.enum(MODIFIERS)).optional().default([]),
      scope_maps:z.array(z.enum(MAPS)).optional().default([]).describe("Canonical maps needed to resolve entities or dimensions mentioned by the user.")
    },
    annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
  },async(args)=>{
    const started=Date.now();
    const out=decide(args);
    protocolLog({event:"MCP_DECIDE",duration_ms:Date.now()-started,request_id:out.request_id,intention:out.intention,capabilities:(out.capabilities||[]).map(x=>x.id),scope_maps:Object.keys(out.scope_maps||{}),limitations:out.limitations||[]});
    return{structuredContent:out,content:[{type:"text",text:JSON.stringify(out)}]};
  });

  registerAppTool(server,"execute_portfolio",{
    title:"Execute and show Simple portfolio",
    description:"Execute PORTFOLIO evidence offered by decide and show the resulting Simple Chile work visually. Use this whenever decide offers PORTFOLIO and concrete portfolio evidence is relevant.",
    inputSchema:{
      request_id:z.string().min(1).describe("request_id returned by the preceding decide call."),
      scope:z.object({
        client_ids:z.array(z.string()).optional(),
        work_ids:z.array(z.string()).optional(),
        industry_ids:z.array(z.string()).optional()
      }).default({})
    },
    outputSchema:{
      works:z.array(z.object({
        work_id:z.string(),
        client_id:z.string(),
        client:z.string(),
        title:z.string(),
        youtube_url:z.string(),
        source_url:z.string()
      }))
    },
    _meta:{
      ui:{resourceUri:SIMPLE_WORK_URI},
      "openai/outputTemplate":SIMPLE_WORK_URI,
      "openai/toolInvocation/invoking":"Buscando trabajos…",
      "openai/toolInvocation/invoked":"Trabajos listos."
    },
    annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
  },async({request_id,scope})=>{
    const started=Date.now();
    const out=execute({request_id,capability:"PORTFOLIO",scope});
    const rows=out.result&&Array.isArray(out.result.records)?out.result.records:[];
    protocolLog({event:"MCP_EXECUTE_PORTFOLIO",tool:"execute_portfolio",duration_ms:Date.now()-started,execution_id:out.execution_id,request_id:out.request_id,capability:"PORTFOLIO",scope:out.scope,status:out.status,record_count:rows.length,limitations:out.limitations||[]});
    return{
      structuredContent:{works:rows},
      content:[{type:"text",text:rows.length?"Trabajos de Simple Chile listos para mostrar.":"No se encontraron trabajos para ese alcance."}]
    };
  });

  server.registerTool("execute",{
    title:"Execute a Simple capability",
    description:"Second step after decide. Execute exactly one non-portfolio capability offered by decide, using the same request_id and a scope constructed from that capability's input contract and canonical maps. For PORTFOLIO use execute_portfolio.",
    inputSchema:{
      request_id:z.string().min(1).describe("request_id returned by the preceding decide call, used for traceability."),
      capability:z.enum(CAPABILITIES),
      scope:z.object({}).catchall(z.union([z.string(),z.number(),z.boolean(),z.array(z.string())])).default({}).describe("Concrete scope conforming to the selected capability input_contract.")
    },
    annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
  },async(args)=>{
    const started=Date.now();
    const out=execute(args);
    protocolLog({event:"MCP_EXECUTE",duration_ms:Date.now()-started,execution_id:out.execution_id,request_id:out.request_id,capability:out.capability,scope:out.scope,status:out.status,record_count:out.result&&Array.isArray(out.result.records)?out.result.records.length:0,limitations:out.limitations||[]});
    return{structuredContent:out,content:[{type:"text",text:JSON.stringify(out)}]};
  });

  const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
  res.on("close",()=>{transport.close().catch(()=>{});server.close().catch(()=>{});});
  await server.connect(transport);
  await transport.handleRequest(req,res,req.body);
};
