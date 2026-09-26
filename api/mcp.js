"use strict";
module.exports=async(req,res)=>{
  if(req.method==="GET") return res.status(200).json({status:"ok",service:"simple-chile-mcp",diagnostic:"minimal"});
  return res.status(503).json({error:"MCP_DIAGNOSTIC_MODE"});
};
