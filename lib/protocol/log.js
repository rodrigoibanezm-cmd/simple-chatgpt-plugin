"use strict";
function protocolLog(event){
  console.log(JSON.stringify({log_type:"SIMPLE_PROTOCOL",timestamp:new Date().toISOString(),...event}));
}
module.exports={protocolLog};
