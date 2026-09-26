"use strict";

const SYSTEM_PROMPT=[
  "Produce creative direction from the supplied contract.",
  "Treat certified evidence and assets as authoritative.",
  "Return only valid JSON matching the requested output schema."
].join(" ");

const OUTPUT_SCHEMA={
  idea:"string",
  message:"string",
  story:[{purpose:"string",evidence_refs:["string"],direction:"string"}]
};

function buildContract({user_question,certified_evidence=[],available_assets=[]}={}){
  if(typeof user_question!=="string"||!user_question.trim()) throw new Error("user_question is required");
  if(!Array.isArray(certified_evidence)) throw new Error("certified_evidence must be an array");
  if(!Array.isArray(available_assets)) throw new Error("available_assets must be an array");
  return {
    role:"creative_director",
    assignment:{
      objective:"Create the creative direction for a short visual piece that answers the user's question.",
      context:"The piece will be experienced inside a conversational interface.",
      target_duration_seconds:15
    },
    creative_principles:[
      "creative direction",
      "visual storytelling",
      "relevance to user intent"
    ],
    responsibilities:[
      "find one central creative idea",
      "decide what the story should communicate",
      "select which evidence deserves protagonism",
      "decide what to show and what to omit",
      "define the narrative progression",
      "define the opening and closing"
    ],
    boundaries:[
      "use only supplied certified evidence and assets",
      "never invent facts, clients, works, credentials or assets",
      "prefer showing evidence over explaining it",
      "do not try to include everything",
      "do not specify layout, typography, colors, transitions, animation or implementation"
    ],
    input:{user_question:user_question.trim(),certified_evidence,available_assets},
    output_schema:OUTPUT_SCHEMA
  };
}

function refIds(items){
  const ids=new Set();
  for(const item of items||[]){
    if(typeof item==="string") ids.add(item);
    else if(item&&typeof item==="object"){
      for(const key of ["id","evidence_id","asset_id","work_id","client_id","source_id","ref"]){
        if(typeof item[key]==="string"&&item[key]) ids.add(item[key]);
      }
    }
  }
  return ids;
}

function validateCreativeBrief(brief,contract){
  const errors=[];
  if(!brief||typeof brief!=="object"||Array.isArray(brief)) return {ok:false,errors:["brief must be an object"]};
  if(typeof brief.idea!=="string"||!brief.idea.trim()) errors.push("idea is required");
  if(typeof brief.message!=="string"||!brief.message.trim()) errors.push("message is required");
  if(!Array.isArray(brief.story)||!brief.story.length) errors.push("story must be a non-empty array");
  const allowed=new Set([
    ...refIds(contract?.input?.certified_evidence),
    ...refIds(contract?.input?.available_assets)
  ]);
  for(const [i,scene] of (brief.story||[]).entries()){
    if(!scene||typeof scene!=="object"||Array.isArray(scene)){errors.push(`story[${i}] must be an object`);continue;}
    if(typeof scene.purpose!=="string"||!scene.purpose.trim()) errors.push(`story[${i}].purpose is required`);
    if(typeof scene.direction!=="string"||!scene.direction.trim()) errors.push(`story[${i}].direction is required`);
    if(scene.evidence_refs!==undefined&&!Array.isArray(scene.evidence_refs)) errors.push(`story[${i}].evidence_refs must be an array`);
    for(const ref of scene.evidence_refs||[]){
      if(typeof ref!=="string") errors.push(`story[${i}].evidence_refs contains a non-string ref`);
      else if(!allowed.has(ref)) errors.push(`story[${i}] references unknown evidence/asset: ${ref}`);
    }
  }
  return {ok:errors.length===0,errors};
}

module.exports={SYSTEM_PROMPT,OUTPUT_SCHEMA,buildContract,validateCreativeBrief};
