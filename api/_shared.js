'use strict';
const crypto=require('node:crypto');
function key(){const s=process.env.BOTPRESS_POC_TOKEN||'';if(s.length<32)throw new Error('UNCONFIGURED');return crypto.createHash('sha256').update(s).digest();}
function valid(x){
  if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Invalid quotation');
  const customer=String(x.customer||x.client||'').trim().slice(0,120);
  if(!customer)throw Error('Customer required');
  const raw=Array.isArray(x.lines)?x.lines:[];
  if(!raw.length||raw.length>20)throw Error('1 to 20 lines required');
  const lines=raw.map((a)=>{if(!a||typeof a!=='object')throw Error('Invalid line');
    const product=String(a.product||a.description||'').trim().slice(0,150);
    const quantity=Number(a.quantity),unit_price=Number(a.unit_price);
    if(!product||!Number.isFinite(quantity)||quantity<=0||quantity>100000||
       !Number.isFinite(unit_price)||unit_price<0||unit_price>100000000)throw Error('Invalid product, quantity or price');
    return {product,quantity,unit_price};
  });
  const basis=x.price_basis==='HT'||x.price_basis==='TTC'?x.price_basis:null;
  const rate=(x.vat_rate===null||x.vat_rate===undefined||x.vat_rate==='')?null:Number(x.vat_rate);
  if(rate!==null&&(!Number.isFinite(rate)||rate<0||rate>100))throw Error('Invalid VAT rate');
  return {customer,lines,price_basis:basis,vat_rate:rate,created_at:new Date().toISOString(),simulation:true};
}
function encrypt(data){const iv=crypto.randomBytes(12), c=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const payload=JSON.stringify({...data,exp:Date.now()+20*60*1000});
  const encrypted=Buffer.concat([c.update(payload,'utf8'),c.final()]);
  return Buffer.concat([iv,c.getAuthTag(),encrypted]).toString('base64url');
}
function decrypt(s){if(typeof s!=='string'||s.length>10000||!s)return null;
  try{const b=Buffer.from(s,'base64url');if(b.length<29)return null;
    const d=crypto.createDecipheriv('aes-256-gcm',key(),b.subarray(0,12));
    d.setAuthTag(b.subarray(12,28));const x=JSON.parse(Buffer.concat([d.update(b.subarray(28)),d.final()]).toString('utf8'));
    return x.exp>Date.now()?x:null;
  }catch(_){return null}
}
module.exports={key,valid,encrypt,decrypt};