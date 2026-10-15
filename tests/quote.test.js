'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {valid,encrypt,decrypt}=require('../api/_shared');
process.env.BOTPRESS_POC_TOKEN='test-only-not-production-secret-of-length-over-32';
test('validates and normalizes a quotation without assigning VAT',()=>{
 const d=valid({customer:'ALPHA',lines:[{product:'Contacteur',quantity:2,unit_price:150}]});
 assert.equal(d.customer,'ALPHA');assert.equal(d.vat_rate,null);assert.equal(d.price_basis,null);
});
test('explicit HT / VAT from ATLAS preserved, but not inherited',()=>{
 const d=valid({customer:'ATLAS',lines:[{product:'Variateur',quantity:3,unit_price:700}],price_basis:'HT',vat_rate:20});
 assert.equal(d.price_basis,'HT');assert.equal(d.vat_rate,20);
 const fresh=valid({customer:'BETA',lines:[{product:'Contacteur',quantity:4,unit_price:180}]});
 assert.equal(fresh.vat_rate,null);assert.equal(fresh.price_basis,null);
});
test('encrypt/decrypt round trip; ciphertext tampering rejected',()=>{
 const src=valid({customer:'ATLAS',lines:[{product:'Variateur',quantity:3,unit_price:700}]});
 const token=encrypt(src);assert.equal(decrypt(token).customer,'ATLAS');
 const buf=Buffer.from(token,'base64url');buf[buf.length-1]^=1;
 assert.equal(decrypt(buf.toString('base64url')),null);
});
test('rejects malicious or invalid amounts',()=>{
 assert.throws(()=>valid({customer:'A',lines:[{product:'X',quantity:-2,unit_price:700}]}));
 assert.throws(()=>valid({customer:'A',lines:[{product:'X',quantity:1,unit_price:-9}]}));
 assert.throws(()=>valid({customer:'A',lines:[{product:'X',quantity:1,unit_price:100}],vat_rate:120}));
 assert.throws(()=>valid({customer:'A',lines:[]}));
});
