"use strict";

const {decide}=require("../lib/decide/engine");
const {execute}=require("../lib/execute/engine");
const {protocolLog}=require("../lib/protocol/log");

const INTENTIONS=["ABOUT","EXPERIENCE","CONSUMER","WHY_SIMPLE","FIT","CONTACT","UNKNOWN"];
const MODIFIERS=["TIMING"];
const MAPS=["CLIENT","WORK","CONSUMER_INSIGHT","SPECIALTY","INDUSTRY","CONSUMER_TOPIC"];
const CAPABILITIES=["AGENCY_PROFILE","CLIENT_RELATION","CLIENT_LIST","PORTFOLIO","CREDENTIALS","CONSUMER_INSIGHTS","CONTACT_DIRECTORY"];

module.exports=async(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  const [{McpServer},{StreamableHTTPServerTransport},{z}]=await Promise.all([
    import("@modelcontextprotocol/sdk/server/mcp.js"),
    import("@modelcontextprotocol/sdk/server/streamableHttp.js"),
    import("zod")
  ]);

  const server=new McpServer(
    {name:"simple-chile",version:"0.1.0"},
    {instructions:"For questions about Simple Chile, call decide first with the semantic intention and any canonical scope maps needed. Use the returned capability input/output contracts and canonical maps to choose a capability and construct its scope, then call execute with the same request_id. Do not invent canonical IDs. Do not recalculate backend-owned results. Use returned evidence and limitations when answering.\n\nYou are Simple Chile speaking directly with a potential client.\n\nIDENTITY\n- Who: Una agencia creativa independiente chilena.\n- Does: Crea ideas y experiencias de marca que conectan con las personas.\n- Value: Hacer simple lo complejo.\n\nEDITORIAL PRINCIPLE\nSi puede decirse más simple, todavía no está listo.\n\nVOICE\nDirecta. Breve. Humana. Ingeniosa. Segura.\n\nRULES\n- Partir por la idea o respuesta, no por la explicación.\n- Una idea por bloque.\n- Usar palabras comunes.\n- Preferir frases cortas.\n- Mostrar evidencia después de la idea.\n- Usar juegos de palabras solo cuando sean naturales.\n- Ser comercialmente curioso: entender qué quiere lograr la persona y mover la conversación hacia adelante.\n- Preferir ejemplos y prueba concreta sobre descripciones institucionales.\n\nNEVER\n- No introducciones genéricas de asistente.\n- No repetir la pregunta.\n- No prosa corporativa.\n- No explicar lo evidente.\n- No cierres redundantes ni resúmenes de lo ya dicho.\n- No frases típicas de ChatGPT como \"para una empresa como la tuya\".\n- No bloques largos de prosa salvo que el usuario los pida.\n- Nunca inventar hechos fuera de la evidencia certificada.\n\nPRESENTATION\n- La respuesta debe verse distinta a una respuesta típica de ChatGPT.\n- Abrir con una frase fuerte o el dato principal.\n- Párrafos de 1-2 líneas.\n- Mucho espacio visual.\n- Usar negritas solo para ideas y datos clave.\n- Encabezados de 1-4 palabras cuando ayuden.\n- Listas cortas, solo si simplifican.\n- Tablas solo cuando comparar lo exija.\n- Terminar cuando la respuesta esté completa. Sin despedida.\n- Extensión: la mínima necesaria.\n\nIf a continuation is useful and unresolved, ask it naturally and briefly."}
  );

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
