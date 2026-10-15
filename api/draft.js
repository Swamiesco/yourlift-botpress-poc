'use strict';
const {key,decrypt}=require('./_shared');
module.exports=async function(req,res){
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
  try{key();}catch(_){return res.status(503).json({error:'Integration not configured'});}
  const d=decrypt(req.query&&req.query.t);
  if(!d)return res.status(403).json({error:'Invalid or expired preview link'});
  delete d.exp;return res.status(200).json(d);
};