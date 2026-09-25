"use strict";

const {decide}=require("../lib/decide/engine");
const {execute,works}=require("../lib/execute/engine");
const {protocolLog}=require("../lib/protocol/log");

const INTENTIONS=["ABOUT","EXPERIENCE","CONSUMER","WHY_SIMPLE","FIT","CONTACT","UNKNOWN"];
const MODIFIERS=["TIMING"];
const MAPS=["CLIENT","WORK","CONSUMER_INSIGHT","SPECIALTY","INDUSTRY","CONSUMER_TOPIC"];
const CAPABILITIES=["AGENCY_PROFILE","CLIENT_RELATION","CLIENT_LIST","PORTFOLIO","CREDENTIALS","CONSUMER_INSIGHTS","CONTACT_DIRECTORY"];
const SIMPLE_WORK_URI="ui://simple/work.html";

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
.card{background:#111;color:#fff;min-height:300px;position:relative;overflow:hidden;border-radius:2px}
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
  <div id="grid" class="grid"></div>
</div>
<script>
(function(){
  function esc(v){return String(v??"").replace(/[&<>"']/g,function(ch){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[ch]})}
  function youtubeId(url){try{return new URL(url).searchParams.get("v")||""}catch(e){return""}}
  function render(data){
    var rows=(data&&data.works)||[];
    var grid=document.getElementById("grid");
    if(!rows.length){grid.innerHTML='<div class="empty">No hay trabajos para mostrar.</div>';return}
    grid.innerHTML=rows.slice(0,4).map(function(w){
      var id=youtubeId(w.youtube_url);
      var img=id?"https://i.ytimg.com/vi/"+encodeURIComponent(id)+"/hqdefault.jpg":"";
      return '<article class="card">'+
        (img?'<img src="'+img+'" alt="">':'')+
        '<div class="copy"><div class="client">'+esc(w.client)+'</div>'+
        '<div class="title">'+esc(w.title)+'</div>'+
        '<div class="link">Ver trabajo →</div></div></article>';
    }).join("");
    document.querySelectorAll(".card").forEach(function(el,i){
      el.addEventListener("click",function(){
        var href=rows[i]&&rows[i].youtube_url;
        if(!href)return;
        if(window.openai&&window.openai.openExternal)window.openai.openExternal({href:href});
        else window.open(href,"_blank","noopener,noreferrer");
      });
    });
  }
  render((window.openai&&window.openai.toolOutput)||{});
  window.addEventListener("openai:set_globals",function(e){
    if(e.detail&&e.detail.globals&&e.detail.globals.toolOutput)render(e.detail.globals.toolOutput);
  });
})();
</script>
</body>
</html>`;

module.exports=async(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  const [{McpServer},{StreamableHTTPServerTransport},{z}]=await Promise.all([
    import("@modelcontextprotocol/sdk/server/mcp.js"),
    import("@modelcontextprotocol/sdk/server/streamableHttp.js"),
    import("zod")
  ]);

  const server=new McpServer(
    {name:"simple-chile",version:"0.1.0"},
    {instructions:"For questions about Simple Chile, call decide first with the semantic intention and any canonical scope maps needed. Use the returned capability input/output contracts and canonical maps to choose a capability and construct its scope, then call execute with the same request_id. Do not invent canonical IDs. Do not recalculate backend-owned results. Use returned evidence and limitations when answering.\n\nYou are Simple Chile speaking directly with a potential client.\n\nIDENTITY\n- Who: Una agencia creativa independiente chilena.\n- Does: Crea ideas y experiencias de marca que conectan con las personas.\n- Value: Hacer simple lo complejo.\n\nEDITORIAL PRINCIPLE\nSi puede decirse más simple, todavía no está listo.\n\nVOICE\nDirecta. Breve. Humana. Ingeniosa. Segura.\n\nRULES\n- Partir por la idea o respuesta, no por la explicación.\n- Una idea por bloque.\n- Usar palabras comunes.\n- Preferir frases cortas.\n- Mostrar evidencia después de la idea.\n- Usar juegos de palabras solo cuando sean naturales.\n- Ser comercialmente curioso: entender qué quiere lograr la persona y mover la conversación hacia adelante.\n- Preferir ejemplos y prueba concreta sobre descripciones institucionales.\n\nNEVER\n- No introducciones genéricas de asistente.\n- No repetir la pregunta.\n- No prosa corporativa.\n- No explicar lo evidente.\n- No cierres redundantes ni resúmenes de lo ya dicho.\n- No frases típicas de ChatGPT como \"para una empresa como la tuya\".\n- No bloques largos de prosa salvo que el usuario los pida.\n- Nunca inventar hechos fuera de la evidencia certificada.\n\nPRESENTATION\n- La respuesta debe verse distinta a una respuesta típica de ChatGPT.\n- Abrir con una frase fuerte o el dato principal.\n- Párrafos de 1-2 líneas.\n- Mucho espacio visual.\n- Usar negritas solo para ideas y datos clave.\n- Encabezados de 1-4 palabras cuando ayuden.\n- Listas cortas, solo si simplifican.\n- Tablas solo cuando comparar lo exija.\n- Terminar cuando la respuesta esté completa. Sin despedida.\n- Extensión: la mínima necesaria.\n\nIf a continuation is useful and unresolved, ask it naturally and briefly. When PORTFOLIO returns concrete work that would benefit from being shown visually, call render_simple_work with the relevant work_ids after execute. The visual component is evidence presentation, not a replacement for execute."}
  );

  server.registerResource("simple-work",SIMPLE_WORK_URI,{},async()=>({
    contents:[{
      uri:SIMPLE_WORK_URI,
      mimeType:"text/html;profile=mcp-app",
      text:SIMPLE_WORK_HTML,
      _meta:{
        ui:{
          prefersBorder:false,
          csp:{resourceDomains:["https://i.ytimg.com"]}
        },
        "openai/widgetCSP":{resource_domains:["https://i.ytimg.com"]}
      }
    }]
  }));

  server.registerTool("render_simple_work",{
    title:"Show Simple work",
    description:"Render selected Simple Chile portfolio work visually. Use only after PORTFOLIO evidence has identified the relevant work.",
    inputSchema:{
      work_ids:z.array(z.string()).min(1).max(4).describe("Canonical WORK ids already returned by PORTFOLIO.")
    },
    _meta:{
      ui:{resourceUri:SIMPLE_WORK_URI},
      "openai/outputTemplate":SIMPLE_WORK_URI,
      "openai/toolInvocation/invoking":"Preparando trabajos…",
      "openai/toolInvocation/invoked":"Trabajos listos."
    },
    annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
  },async({work_ids})=>{
    const all=works();
    const selected=work_ids.map(id=>all.find(w=>w.work_id===id)).filter(Boolean);
    return{
      structuredContent:{works:selected},
      content:[{type:"text",text:selected.length?"Mostrando trabajos seleccionados de Simple Chile.":"No se encontraron trabajos para esos IDs."}]
    };
  });

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

  server.registerTool("execute",{
    title:"Execute a Simple capability",
    description:"Second step after decide. Execute exactly one capability offered by decide, using the same request_id and a scope constructed from that capability's input contract and canonical maps.",
    inputSchema:{
      request_id:z.string().min(1).describe("request_id returned by the preceding decide call, used for traceability."),
      capability:z.enum(CAPABILITIES),
      scope:z.object({}).catchall(z.union([z.string(),z.number(),z.boolean(),z.array(z.string())])).default({}).describe("Concrete scope conforming to the selected capability input_contract. Values are strings, numbers, booleans, or arrays of canonical string IDs.")
    },
    _meta:{
      ui:{resourceUri:SIMPLE_WORK_URI},
      "openai/outputTemplate":SIMPLE_WORK_URI
    },
    annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}
  },async(args)=>{
    const started=Date.now();
    const out=execute(args);
    protocolLog({event:"MCP_EXECUTE",duration_ms:Date.now()-started,execution_id:out.execution_id,request_id:out.request_id,capability:out.capability,scope:out.scope,status:out.status,record_count:out.result&&Array.isArray(out.result.records)?out.result.records.length:0,limitations:out.limitations||[]});
    if(args.capability==="PORTFOLIO"){
      const rows=out.result&&Array.isArray(out.result.records)?out.result.records:[];
      return{
        structuredContent:{...out,works:rows},
        content:[{type:"text",text:JSON.stringify(out)}],
        _meta:{ui:{resourceUri:SIMPLE_WORK_URI},"openai/outputTemplate":SIMPLE_WORK_URI}
      };
    }
    return{structuredContent:out,content:[{type:"text",text:JSON.stringify(out)}]};
  });

  const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
  res.on("close",()=>{transport.close().catch(()=>{});server.close().catch(()=>{});});
  await server.connect(transport);
  await transport.handleRequest(req,res,req.body);
};
