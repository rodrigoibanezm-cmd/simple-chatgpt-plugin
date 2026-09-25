"use strict";

const {decide}=require("../lib/decide/engine");
const {execute}=require("../lib/execute/engine");
const {protocolLog}=require("../lib/protocol/log");

const INTENTIONS=["ABOUT","EXPERIENCE","CONSUMER","WHY_SIMPLE","FIT","CONTACT","UNKNOWN"];
const MODIFIERS=["TIMING"];
const MAPS=["CLIENT","WORK","CONSUMER_INSIGHT","SPECIALTY","INDUSTRY","CONSUMER_TOPIC"];
const CAPABILITIES=["AGENCY_PROFILE","CLIENT_RELATION","CLIENT_LIST","PORTFOLIO","CREDENTIALS","CONSUMER_INSIGHTS","CONTACT_DIRECTORY"];
const PRESENTATIONS=["WORK_GALLERY","CLIENT_GRID","CREDENTIAL_LIST","PROFILE","GENERIC_LIST"];
const SIMPLE_RENDER_URI="ui://simple/render/v4.html";
const SIMPLE_WIDGET_DOMAIN="https://simple-chatgpt-plugin.vercel.app";

const SIMPLE_RENDER_HTML=`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;color:#151515}*{box-sizing:border-box}body{margin:0;background:#f3f0e8}main{padding:22px;display:grid;gap:16px}.eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.card{background:#fff;border-radius:18px;overflow:hidden;min-width:0}.card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}.body{padding:16px}.client{font-size:12px;text-transform:uppercase;letter-spacing:.08em}.title{font-family:Georgia,serif;font-size:26px;line-height:1.02;margin:7px 0 12px}.link{font-size:12px;font-weight:700;text-decoration:none;color:inherit}.row{background:#fff;border-radius:14px;padding:15px 16px}.row strong{display:block}.client-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.client-card{background:#fff;border-radius:18px;min-height:150px;padding:18px;display:flex;flex-direction:column;justify-content:space-between}.client-logo{width:100%;height:78px;object-fit:contain}.client-name{font-size:12px;font-weight:700;letter-spacing:.04em}.client-work{font-size:11px;border:0;background:none;padding:0;color:inherit;margin-top:8px;cursor:pointer}.video{margin-top:14px;aspect-ratio:16/9}.video iframe{width:100%;height:100%;border:0;border-radius:12px}@media(max-width:700px){.client-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}.empty{background:#fff;border-radius:16px;padding:18px}h2{font-family:Georgia,serif;font-size:30px;margin:0}
</style></head><body><main id="app"><div class="empty">Cargando…</div></main>
<script>
const app=document.getElementById("app");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function thumb(r){const id=(r.youtube_url||"").match(/(?:v=|youtu\\.be\\/)([A-Za-z0-9_-]{6,})/)?.[1];return id?"https://i.ytimg.com/vi/"+id+"/hqdefault.jpg":""}
function workGallery(data){const rows=data.records||[];return '<div class="eyebrow">Simple / Trabajos</div><div class="grid">'+rows.map(r=>'<article class="card">'+(thumb(r)?'<img src="'+esc(thumb(r))+'" alt="">':'')+'<div class="body"><div class="client">'+esc(r.client||r.client_id)+'</div><div class="title">'+esc(r.title)+'</div>'+(r.youtube_url?'<a class="link" href="'+esc(r.youtube_url)+'" target="_blank">VER TRABAJO →</a>':'')+'</div></article>').join("")+'</div>'}
function youtubeId(url){return (url||"").match(/(?:v=|youtu\\.be\\/)([A-Za-z0-9_-]{6,})/)?.[1]||""}
function clientGrid(data){const rows=data.records||[];return '<div class="eyebrow">Simple / Clientes</div><div class="client-grid">'+rows.map(r=>{const works=r.published_works||[],first=works[0],vid=youtubeId(first?.youtube_url);return '<article class="client-card">'+(r.logo_url?'<img class="client-logo" src="'+esc(r.logo_url)+'" alt="'+esc(r.label||r.client_id)+'">':'<div class="title">'+esc(r.label||r.client_id)+'</div>')+'<div><div class="client-name">'+esc(r.label||r.client_id)+'</div>'+(vid?'<button class="client-work" data-video="'+esc(vid)+'">'+(works.length>1?esc(works.length+" TRABAJOS"):"VER TRABAJO")+' →</button>':'')+'<div class="video" hidden></div></div></article>'}).join("")+'</div>'}
function rowsView(data){const rows=data.records||[];return '<div class="grid">'+rows.map(r=>'<div class="row">'+Object.entries(r).filter(([,v])=>v!==null&&v!==undefined).map(([k,v])=>'<strong>'+esc(k.replaceAll("_"," "))+'</strong><span>'+esc(Array.isArray(v)?v.join(", "):v)+'</span>').join("")+'</div>').join("")+'</div>'}
function render(payload){if(!payload)return;const p=payload.presentation||"GENERIC_LIST",data=payload.data||{};app.innerHTML=p==="WORK_GALLERY"?workGallery(data):p==="CLIENT_GRID"?clientGrid(data):rowsView(data)}
app.addEventListener("click",e=>{const b=e.target.closest("[data-video]");if(!b)return;const box=b.parentElement.querySelector(".video"),id=b.dataset.video;if(!box)return;if(box.hidden){box.innerHTML='<iframe src="https://www.youtube.com/embed/'+esc(id)+'?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';box.hidden=false;b.textContent="CERRAR TRABAJO ↑"}else{box.innerHTML="";box.hidden=true;b.textContent="VER TRABAJO →"}});
window.addEventListener("message",e=>{const m=e.data;if(m?.method==="ui/notifications/tool-result")render(m.params?.structuredContent)});
if(window.openai?.toolOutput)render(window.openai.toolOutput);
let seq=1;const id=seq++;window.parent.postMessage({jsonrpc:"2.0",id,method:"ui/initialize",params:{protocolVersion:"2026-01-26",capabilities:{},clientInfo:{name:"simple-render",version:"1.0.0"}}},"*");
window.addEventListener("message",function init(e){if(e.data?.id===id){window.parent.postMessage({jsonrpc:"2.0",method:"ui/notifications/initialized"},"*");window.removeEventListener("message",init)}});
</script></body></html>`;

module.exports=async(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  const [{McpServer},{StreamableHTTPServerTransport},{z},{registerAppResource,registerAppTool,RESOURCE_MIME_TYPE}]=await Promise.all([
    import("@modelcontextprotocol/sdk/server/mcp.js"),
    import("@modelcontextprotocol/sdk/server/streamableHttp.js"),
    import("zod"),
    import("@modelcontextprotocol/ext-apps/server")
  ]);

  const server=new McpServer(
    {name:"simple-chile",version:"0.1.0"},
    {instructions:"For questions about Simple Chile, call decide first with the semantic intention and any canonical scope maps needed. Use the returned capability input/output contracts and canonical maps to choose a capability and construct its scope, then call execute with the same request_id. Do not invent canonical IDs. Do not recalculate backend-owned results. Use returned evidence and limitations when answering. After every execute and before answering the user, apply this presentation switch: \"Would the answer be easier to understand with a render?\" If YES, call the single render tool before answering and pass only certified execute result data. If NO, answer directly. Do not treat having enough evidence as permission to skip this switch.\n\nExamples where the switch is YES:\n- \"Muéstrame trabajos de Simple en automotriz.\" Multiple visual work records are clearer as WORK_GALLERY.\n- \"¿Qué clientes tiene Simple?\" A large client collection is clearer as CLIENT_GRID.\n\nExamples where the switch is NO:\n- \"¿Simple ha trabajado con Colun?\" A punctual yes/no relationship with evidence is clearer as text.\n- \"¿Cuál es el mail de contacto para medios?\" A single concrete contact datum is clearer as text.\n\nChoose presentation semantically: WORK_GALLERY for concrete published work, CLIENT_GRID for client collections, CREDENTIAL_LIST for credentials, PROFILE for institutional profile, otherwise GENERIC_LIST. Rendering never changes evidence. When the rendered evidence is a large collection, do not repeat the collection as prose. The UI already carries the list. Add at most one short sentence that interprets or contextualizes it. If a text-only answer must enumerate more than 6 items, never use a running sentence or dot/comma-separated paragraph; format the items as a vertical list or a compact 2-3 column table.\n\nYou are Simple Chile speaking directly with a potential client.\n\nIDENTITY\n- Who: Una agencia creativa independiente chilena.\n- Does: Crea ideas y experiencias de marca que conectan con las personas.\n- Value: Hacer simple lo complejo.\n\nEDITORIAL PRINCIPLE\nSi puede decirse más simple, todavía no está listo.\n\nVOICE\nDirecta. Breve. Humana. Ingeniosa. Segura.\n\nRULES\n- Partir por la idea o respuesta, no por la explicación.\n- Una idea por bloque.\n- Usar palabras comunes.\n- Preferir frases cortas.\n- Mostrar evidencia después de la idea.\n- Usar juegos de palabras solo cuando sean naturales.\n- Ser comercialmente curioso: entender qué quiere lograr la persona y mover la conversación hacia adelante.\n- Preferir ejemplos y prueba concreta sobre descripciones institucionales.\n\nNEVER\n- No introducciones genéricas de asistente.\n- No repetir la pregunta.\n- No prosa corporativa.\n- No explicar lo evidente.\n- No cierres redundantes ni resúmenes de lo ya dicho.\n- No frases típicas de ChatGPT como \"para una empresa como la tuya\".\n- No bloques largos de prosa salvo que el usuario los pida.\n- Nunca inventar hechos fuera de la evidencia certificada.\n\nPRESENTATION\n- La respuesta debe verse distinta a una respuesta típica de ChatGPT.\n- Abrir con una frase fuerte o el dato principal.\n- Párrafos de 1-2 líneas.\n- Mucho espacio visual.\n- Usar negritas solo para ideas y datos clave.\n- Encabezados de 1-4 palabras cuando ayuden.\n- Listas cortas, solo si simplifican.\n- Tablas solo cuando comparar lo exija.\n- Terminar cuando la respuesta esté completa. Sin despedida.\n- Extensión: la mínima necesaria.\n\nIf a continuation is useful and unresolved, ask it naturally and briefly."}
  );

  registerAppResource(server,"simple-render",SIMPLE_RENDER_URI,{},async()=>({contents:[{uri:SIMPLE_RENDER_URI,mimeType:RESOURCE_MIME_TYPE,text:SIMPLE_RENDER_HTML,_meta:{ui:{prefersBorder:false,domain:SIMPLE_WIDGET_DOMAIN,csp:{resourceDomains:["https://i.ytimg.com","https://simplechile.com"],frameDomains:["https://www.youtube.com","https://www.youtube-nocookie.com"]}},"openai/widgetDomain":SIMPLE_WIDGET_DOMAIN}}]}));

  server.registerTool("decide",{
    title:"Discover Simple capabilities",
    description:"First step for questions about Simple Chile. Discover the backend capabilities, their input/output contracts, canonical maps, limitations and useful continuations for the user's semantic intention. Call this before execute.",
    inputSchema:{
      intention:z.enum(INTENTIONS).describe("Semantic intention inferred from the user's question."),
      modifiers:z.array(z.enum(MODIFIERS)).optional().default([]),
      scope_maps:z.array(z.enum(MAPS)).optional().default([]).describe("Canonical maps needed to resolve entities or dimensions mentioned by the user.")
    },
    outputSchema:{
      protocol_version:z.string(),
      request_id:z.string(),
      intention:z.enum(INTENTIONS),
      modifiers:z.array(z.string()),
      capabilities:z.array(z.object({
        id:z.enum(CAPABILITIES),
        description:z.string(),
        input_contract:z.any(),
        output_contract:z.any()
      })),
      scope_maps:z.record(z.string(),z.array(z.object({
        id:z.string(),
        label:z.string(),
        aliases:z.array(z.string()).optional()
      }).catchall(z.any()))),
      continuations:z.array(z.object({}).catchall(z.any())),
      limitations:z.array(z.object({code:z.string(),message:z.string()}).catchall(z.any()))
    },
    annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
  },async(args)=>{
    const started=Date.now();
    const out=decide(args);
    protocolLog({event:"MCP_DECIDE",duration_ms:Date.now()-started,request_id:out.request_id,intention:out.intention,capabilities:(out.capabilities||[]).map(x=>x.id),scope_maps:Object.keys(out.scope_maps||{}),limitations:out.limitations||[]});
    return{structuredContent:out,content:[{type:"text",text:JSON.stringify(out)}]};
  });

  server.registerTool("execute",{
    title:"Execute a Simple capability",
    description:"Second step after decide. Execute exactly one capability offered by decide, using the same request_id and a scope constructed from that capability's input contract and canonical maps.",
    inputSchema:{
      request_id:z.string().min(1).describe("request_id returned by the preceding decide call, used for traceability."),
      capability:z.enum(CAPABILITIES),
      scope:z.object({}).catchall(z.union([z.string(),z.number(),z.boolean(),z.array(z.string())])).default({}).describe("Concrete scope conforming to the selected capability input_contract. Values are strings, numbers, booleans, or arrays of canonical string IDs.")
    },
    outputSchema:{
      protocol_version:z.string(),
      request_id:z.string(),
      execution_id:z.string(),
      capability:z.enum(CAPABILITIES),
      scope:z.object({}).catchall(z.any()),
      status:z.enum(["OK","NO_DATA","INVALID_SCOPE","NOT_APPLICABLE"]),
      result:z.object({
        scope:z.object({}).catchall(z.any()),
        records:z.array(z.object({}).catchall(z.any())),
        evidence:z.array(z.object({
          source_id:z.string(),
          source_type:z.string(),
          source_url:z.string(),
          authority:z.string()
        }).catchall(z.any()))
      }),
      context:z.nullable(z.any()),
      limitations:z.array(z.object({code:z.string(),message:z.string()}).catchall(z.any()))
    },
    annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
  },async(args)=>{
    const started=Date.now();
    const out=execute(args);
    protocolLog({event:"MCP_EXECUTE",duration_ms:Date.now()-started,execution_id:out.execution_id,request_id:out.request_id,capability:out.capability,scope:out.scope,status:out.status,record_count:out.result&&Array.isArray(out.result.records)?out.result.records.length:0,limitations:out.limitations||[]});
    return{structuredContent:out,content:[{type:"text",text:JSON.stringify(out)}]};
  });

  registerAppTool(server,"render",{
    title:"Render Simple evidence",
    description:"Presentation step after execute when structured evidence benefits from visual UI. Pass only certified records returned by execute; do not add, infer or recalculate facts.",
    inputSchema:{
      presentation:z.enum(PRESENTATIONS).describe("Visual treatment for the certified execute result."),
      data:z.object({records:z.array(z.object({}).catchall(z.any())).default([])}).catchall(z.any()).describe("Certified result data copied from execute.")
    },
    outputSchema:{
      presentation:z.enum(PRESENTATIONS),
      data:z.object({records:z.array(z.object({}).catchall(z.any())).default([])}).catchall(z.any())
    },
    _meta:{ui:{resourceUri:SIMPLE_RENDER_URI},"openai/outputTemplate":SIMPLE_RENDER_URI}
  },async({presentation,data})=>({
    structuredContent:{presentation,data},
    content:[{type:"text",text:"Rendered certified Simple evidence."}]
  }));

  const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
  res.on("close",()=>{transport.close().catch(()=>{});server.close().catch(()=>{});});
  await server.connect(transport);
  await transport.handleRequest(req,res,req.body);
};
