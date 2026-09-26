"use strict";
module.exports=async(req,res)=>{
 try{
  const a=await import("@modelcontextprotocol/sdk/server/mcp.js");
  const b=await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
  const c=await import("zod");
  const d=await import("@modelcontextprotocol/ext-apps/server");
  return res.status(200).json({ok:true,mcp:Object.keys(a),transport:Object.keys(b),zod:Object.keys(c).slice(0,5),apps:Object.keys(d)});
 }catch(e){return res.status(500).json({ok:false,error:String(e),stack:e&&e.stack});}
};
