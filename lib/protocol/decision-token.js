"use strict";
const crypto=require("crypto");
const VERSION="v1";
function secret(){const s=process.env.DECISION_TOKEN_SECRET;if(!s||s.length<32)throw new Error("DECISION_TOKEN_SECRET must be configured with at least 32 characters");return s;}
const b64=x=>Buffer.from(x).toString("base64url");
function sign(payload){const body=b64(JSON.stringify(payload));const sig=crypto.createHmac("sha256",secret()).update(VERSION+"."+body).digest("base64url");return VERSION+"."+body+"."+sig;}
function verify(token){if(typeof token!=="string")throw new Error("decision_token is required");const parts=token.split(".");if(parts.length!==3||parts[0]!==VERSION)throw new Error("Invalid decision_token format");const [v,body,sig]=parts;const expected=crypto.createHmac("sha256",secret()).update(v+"."+body).digest("base64url");const a=Buffer.from(sig),b=Buffer.from(expected);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))throw new Error("Invalid decision_token signature");let payload;try{payload=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));}catch{throw new Error("Invalid decision_token payload");}if(payload.exp&&Date.now()>payload.exp)throw new Error("decision_token expired");return payload;}
module.exports={sign,verify};
