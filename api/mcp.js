"use strict";
const {decide}=require("../lib/decide/engine");
const {execute}=require("../lib/execute/engine");
const {protocolLog}=require("../lib/protocol/log");
module.exports=async(req,res)=>res.status(200).json({ok:true,decide:typeof decide,execute:typeof execute,protocolLog:typeof protocolLog});
