"use strict";

const {decide}=require("../lib/decide/engine");
const {execute}=require("../lib/execute/engine");
const {protocolLog}=require("../lib/protocol/log");

const INTENTIONS=["ABOUT","EXPERIENCE","CONSUMER","WHY_SIMPLE","FIT","CONTACT","UNKNOWN"];
const MODIFIERS=["TIMING"];
const MAPS=["CLIENT","WORK","CONSUMER_INSIGHT","SPECIALTY","INDUSTRY","CONSUMER_TOPIC"];
const CAPABILITIES=["AGENCY_PROFILE","CLIENT_RELATION","CLIENT_LIST","PORTFOLIO","CREDENTIALS","CONSUMER_INSIGHTS","CONTACT_DIRECTORY"];
const PRESENTATIONS=["WORK_GALLERY","CLIENT_GRID","CREDENTIAL_LIST","PROFILE","GENERIC_LIST"];
const SIMPLE_RENDER_URI="ui://simple/render/v2.html";
const SIMPLE_WIDGET_DOMAIN="https://simple-chatgpt-plugin.vercel.app";

const SIMPLE_RENDER_HTML=`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;color:#151515}*{box-sizing:border-box}body{margin:0;background:#f3f0e8}main{padding:22px;display:grid;gap:16px}.eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.card{background:#fff;border-radius:18px;overflow:hidden;min-width:0}.card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}.body{padding:16px}.client{font-size:12px;text-transform:uppercase;letter-spacing:.08em}.title{font-family:Georgia,serif;font-size:26px;line-height:1.02;margin:7px 0 12px}.link{font-size:12px;font-weight:700;text-decoration:none;color:inherit}.row{background:#fff;border-radius:14px;padding:15px 16px}.row strong{display:block}.empty{background:#fff;border-radius:16px;padding:18px}h2{font-family:Georgia,serif;font-size:30px;margin:0}
</style></head><body><main id="app"><div class="empty">Cargando…</div></main>
<script>
const app=document.getElementById("app");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function thumb(r){const id=(r.youtube_url||"").match(/(?:v=|youtu\\.be\\/)([A-Za-z0-9_-]{6,})/)?.[1];return id?"https://i.ytimg.com/vi/"+id+"/hqdefault.jpg":""}
function workGallery(data){const rows=data.records||[];return '<div class="eyebrow">Simple / Trabajos</div><div class="grid">'+rows.map(r=>'<article class="card">'+(thumb(r)?'<img src="'+esc(thumb(r))+'" alt="">':'')+'<div class="body"><div class="client">'+esc(r.client||r.client_id)+'</div><div class="title">'+esc(r.title)+'</div>'+(r.youtube_url?'<a class="link" href="'+esc(r.youtube_url)+'" target="_blank">VER TRABAJO →</a>':'')+'</div></article>').join("")+'</div>'}
function rowsView(data){const rows=data.records||[];return '<div class="grid">'+rows.map(r=>'<div class="row">'+Object.entries(r).filter(([,v])=>v!==null&&v!==undefined).map(([k,v])=>'<strong>'+esc(k.replaceAll("_"," "))+'</strong><span>'+esc(Array.isArray(v)?v.join(", "):v)+'</span>').join("")+'</div>').join("")+'</div>'}
function render(payload){if(!payload)return;const p=payload.presentation||"GENERIC_LIST",data=payload.data||{};app.innerHTML=p==="WORK_GALLERY"?workGallery(data):rowsView(data)}
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
    {instructions:"For questions about Simple Chile, call decide first with the semantic intention and any canonical scope maps needed. Use the returned capability input/output contracts and canonical maps to choose a capability and construct its scope, then call execute with the same request_id. Do not invent canonical IDs. Do not recalculate backend-owned results. Use returned evidence and limitations when answering. When execute returns structured evidence that benefits from visual presentation, call the single render tool and pass only certified execute result data. Choose presentation semantically: WORK_GALLERY for concrete published work, CLIENT_GRID for client collections, CREDENTIAL_LIST for credentials, PROFILE for institutional profile, otherwise GENERIC_LIST. Rendering never changes evidence and is optional when plain text is clearer.\n\nYou are Simple Chile speaking directly with a potential client.\n\nIDENTITY\n- Who: Una agencia creativa independiente chilena.\n- Does: Crea ideas y experiencias de marca que conectan con las personas.\n- Value: Hacer simple lo complejo.\n\nEDITORIAL PRINCIPLE\nSi puede decirse más simple, todavía no está listo.\n\nVOICE\nDirecta. Breve. Humana. Ingeniosa. Segura.\n\nRULES\n- Partir por la idea o respuesta, no por la explicación.\n- Una idea por bloque.\n- Usar palabras comunes.\n- Preferir frases cortas.\n- Mostrar evidencia después de la idea.\n- Usar juegos de palabras solo cuando sean naturales.\n- Ser comercialmente curioso: entender qué quiere lograr la persona y mover la conversación hacia adelante.\n- Preferir ejemplos y prueba concreta sobre descripciones institucionales.\n\nNEVER\n- No introducciones genéricas de asistente.\n- No repetir la pregunta.\n- No prosa corporativa.\n- No explicar lo evidente.\n- No cierres redundantes ni resúmenes de lo ya dicho.\n- No frases típicas de ChatGPT como \"para una empresa como la tuya\".\n- No bloques largos de prosa salvo que el usuario los pida.\n- Nunca inventar hechos fuera de la evidencia certificada.\n\nPRESENTATION\n- La respuesta debe verse distinta a una respuesta típica de ChatGPT.\n- Abrir con una frase fuerte o el dato principal.\n- Párrafos de 1-2 líneas.\n- Mucho espacio visual.\n- Usar negritas solo para ideas y datos clave.\n- Encabezados de 1-4 palabras cuando ayuden.\n- Listas cortas, solo si simplifican.\n- Tablas solo cuando comparar lo exija.\n- Terminar cuando la respuesta esté completa. Sin despedida.\n- Extensión: la mínima necesaria.\n\nIf a continuation is useful and unresolved, ask it naturally and briefly."}
  );

  registerAppResource(server,"simple-render",SIMPLE_RENDER_URI,{},async()=>({contents:[{uri:SIMPLE_RENDER_URI,mimeType:RESOURCE_MIME_TYPE,text:SIMPLE_RENDER_HTML,_meta:{ui:{prefersBorder:false,domain:SIMPLE_WIDGET_DOMAIN,csp:{resourceDomains:["https://i.ytimg.com"]}},"openai/widgetDomain":SIMPLE_WIDGET_DOMAIN}}]}));

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
