'use strict';
const crypto=require('node:crypto');
const {key,valid,encrypt}=require('./_shared');
module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  let secret;try{secret=key();}catch(_){return res.status(503).json({error:'Integration not configured'});}
  const auth=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const provided=crypto.createHash('sha256').update(auth).digest();
  if(!auth||!crypto.timingSafeEqual(secret,provided))return res.status(401).json({error:'Unauthorized'});
  try{
    const data=valid(req.body),token=encrypt(data);
    const base=(process.env.YOURLIFT_POC_BASE_URL||('https://'+process.env.VERCEL_URL)||'').replace(/\/$/,'');
    const sub=data.lines.reduce((a,l)=>a+l.quantity*l.unit_price,0);
    // The link is an expiring bearer capability; do not forward it to third parties.
    return res.status(200).json({ok:true,simulation:true,preview_url:base+'/?t='+encodeURIComponent(token),
      customer:data.customer,subtotal_input:Math.round(sub*100)/100,currency:'MAD',expires_in_minutes:20,
      note:'Preview only. Does NOT save to Yourlift or issue an official PDF.'});
  }catch(e){return res.status(400).json({error:e.message||'Invalid request'});}
};