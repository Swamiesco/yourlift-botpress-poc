'use strict';
(function(){
const $=id=>document.getElementById(id);
let rows=[],last=null;
const two=n=>Number(n).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).replace(/[\u202f\u00a0]/g,' ')+' MAD';
const txt=(s,max=160)=>String(s||'').trim().slice(0,max);
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const message=s=>{$('status').textContent=s||''};
const cell=(tr,s)=>{const td=document.createElement('td');td.textContent=s;tr.appendChild(td)};
function addRow(item={}){
 if(rows.length>=20){message('Maximum 20 articles.');return}
 const div=document.createElement('div');div.className='row';div.innerHTML=
 '<label class="full">Désignation / المنتوج<input class="product" maxlength="150" placeholder="Variateur" required></label>'+
 '<label>Quantité<input class="qty" type="number" min="0.001" max="100000" step="0.001" inputmode="decimal" required></label>'+
 '<label>Prix unitaire (MAD)<input class="unit" type="number" min="0" max="100000000" step=".01" inputmode="decimal" required></label>'+
 '<button class="remove full" type="button">Supprimer ×</button>';
 div.querySelector('.product').value=item.product||'';
 div.querySelector('.qty').value=item.quantity??1;
 div.querySelector('.unit').value=item.unit_price??'';
 div.querySelector('.remove').onclick=()=>{div.remove();rows=rows.filter(x=>x!==div);update()};
 div.querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>update()));
 $('rows').appendChild(div);rows.push(div);
}
function readData(){
 const customer=txt($('customer').value,120);if(!customer)throw Error('Saisis le nom du client.');
 if(!rows.length)throw Error('Ajoute au moins un article.');
 const lines=rows.map(div=>{
 const product=txt(div.querySelector('.product').value,150),
 quantity=Number(div.querySelector('.qty').value),unit_price=Number(div.querySelector('.unit').value);
 if(!product||!Number.isFinite(quantity)||quantity<=0||quantity>100000||
   !Number.isFinite(unit_price)||unit_price<0||unit_price>100000000||div.querySelector('.unit').value==='')throw Error('Complète la désignation, la quantité et le prix de chaque article.');
 return {product,quantity,unit_price};
 });
 const price_basis=$('basis').value||null;
 const raw=$('rate').value;
 const vat_rate=raw===''?null:Number(raw);
 if(vat_rate!==null&&(!Number.isFinite(vat_rate)||vat_rate<0||vat_rate>100))throw Error('TVA invalide.');
 return {customer,lines,price_basis,vat_rate};
}
function update(){
 $('confirm').checked=false;$('pdf').disabled=true;$('print').disabled=true;last=null;
 try{
 const d=readData(),input=d.lines.reduce((a,l)=>a+l.quantity*l.unit_price,0);
 const taxReady=!!d.price_basis&&d.vat_rate!==null;
 let ht=null,tax=null,ttc=null;
 if(taxReady){
   if(d.price_basis==='HT'){ht=input;tax=round(ht*d.vat_rate/100);ttc=round(ht+tax)}
   else {ttc=input;ht=round(ttc/(1+d.vat_rate/100));tax=round(ttc-ht)}
 }
 $('p-customer').textContent=d.customer;
 $('date').textContent='Date : '+new Date().toLocaleDateString('fr-FR');
 $('pricehead').textContent=d.price_basis?'P.U. '+d.price_basis:'P.U. (?)';
 const body=$('items').querySelector('tbody');body.replaceChildren();
 d.lines.forEach(l=>{const tr=document.createElement('tr');cell(tr,l.product);cell(tr,String(l.quantity));cell(tr,two(l.unit_price));cell(tr,two(l.quantity*l.unit_price));body.appendChild(tr)});
 $('subtotal-label').textContent=taxReady?'Total HT': 'Montant sans base fiscale confirmée';
 $('subtotal').textContent=two(taxReady?ht:input);
 $('tax-label').textContent=d.vat_rate===null?'TVA à préciser':'TVA ('+d.vat_rate+'%)';
 $('tax').textContent=taxReady?two(tax):'—';
 $('grand-label').textContent='Total TTC';$('grand').textContent=taxReady?two(ttc):'—';
 $('pending').textContent=taxReady?'Document de simulation : aucune donnée enregistrée.':
 'Préciser HT/TTC et le taux de TVA avant de confirmer et de télécharger le PDF.';
 last={...d,ht,tax,ttc,input,taxReady};
 message('');
 }catch(e){message(e.message)}
}
function startNew(){rows.forEach(r=>r.remove());rows=[];$('customer').value='';$('basis').value='';$('rate').value='';addRow({quantity:1});update()}
async function fromToken(){
 const q=new URLSearchParams(location.search).get('t');if(!q)return;
 try{
  const r=await fetch('/api/draft?t='+encodeURIComponent(q),{cache:'no-store'});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Lien indisponible');
  rows.forEach(r=>r.remove());rows=[];$('customer').value=d.customer;
  $('basis').value=d.price_basis||'';$('rate').value=d.vat_rate??'';
  d.lines.forEach(addRow);update();message('Prévisualisation Botpress chargée (lien limité à 20 minutes).');
  // Remove bearer token from address bar, but the decrypted draft remains in this tab.
  history.replaceState(null,'',location.pathname);
 }catch(e){message('Lien Botpress invalide ou expiré : '+e.message)}
}
function containsArabic(s){return /[\u0600-\u06ff]/.test(s)}
async function logoPng(){
 const img=new Image();img.src='/website/yourlift-logo.svg';
 await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});
 const cv=document.createElement('canvas');cv.width=450;cv.height=400;
 const ct=cv.getContext('2d');const scale=Math.min(cv.width/img.naturalWidth,cv.height/img.naturalHeight);
 ct.drawImage(img,(cv.width-img.naturalWidth*scale)/2,(cv.height-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);
 return cv.toDataURL('image/png');
}
async function downloadPDF(){
 if(!$('confirm').checked||!last||!last.taxReady)return;
 const d=last;
 if(containsArabic(d.customer+' '+d.lines.map(l=>l.product).join(' '))){
 message('الحروف العربية ممكن ما تبانش مزيان فـjsPDF. استعمل زر Imprimer / PDF (arabe) باش تحفظ PDF بالخط العربي.');return;
 }
 const JS=window.jspdf?.jsPDF;if(!JS){message('Module jsPDF indisponible. Utilise Imprimer / PDF.');return}
 const pdf=new JS({unit:'mm',format:'a4'});if(typeof pdf.autoTable!=='function'){message('Module autoTable indisponible.');return}
 try{pdf.addImage(await logoPng(),'PNG',14,12,23,22,undefined,'FAST')}catch(e){console.warn('Logo PDF:',e)}
 const green=[10,150,104], right=196;
 pdf.setFont('helvetica','bold');pdf.setFontSize(15);pdf.setTextColor(30,42,39);
 pdf.text('YOUR LIFT SARL',41,22);
 pdf.setFontSize(20);pdf.setTextColor(...green);pdf.text('DEVIS',right,20,{align:'right'});
 pdf.setFontSize(9);pdf.setTextColor(75,88,80);pdf.text('TEST-ONLY',right,27,{align:'right'});
 pdf.setFont('helvetica','normal');pdf.text('Date : '+new Date().toLocaleDateString('fr-FR'),right,33,{align:'right'});
 pdf.setDrawColor(215,233,223);pdf.line(14,41,196,41);
 pdf.setFillColor(247,251,249);pdf.setDrawColor(221,235,228);
 pdf.roundedRect(14,46,88,33,2.5,2.5,'FD');pdf.roundedRect(108,46,88,33,2.5,2.5,'FD');
 pdf.setTextColor(92,112,102);pdf.setFont('helvetica','bold');pdf.setFontSize(8);
 pdf.text('DESTINATAIRE',19,53);pdf.text('EMETTEUR',191,53,{align:'right'});
 pdf.setTextColor(32,46,38);pdf.setFontSize(10.5);
 pdf.text(pdf.splitTextToSize(d.customer,76),19,61);
 pdf.text('YOUR LIFT SARL',191,61,{align:'right'});
 pdf.setFont('helvetica','normal');pdf.setFontSize(8);
 pdf.text('Simulation / no customer details stored',19,72);
 pdf.text('Coordonnees non importees',191,72,{align:'right'});
 pdf.autoTable({
  startY:88,margin:{left:14,right:14,bottom:50},
  head:[['Designation','Qte','P.U. '+d.price_basis,'Total '+d.price_basis]],
  body:d.lines.map(l=>[l.product,String(l.quantity),two(l.unit_price),two(l.quantity*l.unit_price)]),
  styles:{fontSize:8,cellPadding:3,lineColor:[232,237,235],lineWidth:.2,textColor:[45,55,61]},
  headStyles:{fillColor:green,textColor:[255,255,255]},
  alternateRowStyles:{fillColor:[249,251,250]}
 });
 let y=(pdf.lastAutoTable.finalY||100)+8;if(y>225){pdf.addPage();y=24}
 const row=(label,value)=>{pdf.setTextColor(68,83,75);pdf.setFontSize(9);pdf.setFont('helvetica','normal');pdf.text(label,143,y);pdf.text(value,right,y,{align:'right'});y+=7};
 row('Total HT',two(d.ht));row('TVA '+d.vat_rate+'%',two(d.tax));
 pdf.setDrawColor(...green);pdf.line(143,y-3,right,y-3);
 pdf.setFont('helvetica','bold');pdf.setFontSize(11);pdf.setTextColor(...green);
 pdf.text('Total TTC',143,y+2);pdf.text(two(d.ttc),right,y+2,{align:'right'});
 const pages=pdf.getNumberOfPages();for(let page=1;page<=pages;page++){
 pdf.setPage(page);pdf.setFont('helvetica','bold');pdf.setTextColor(160,172,166);pdf.setFontSize(16);
 pdf.text('SIMULATION',14,240,{angle:12});
 pdf.setDrawColor(...green);pdf.line(14,277,196,277);
 pdf.setFontSize(8);pdf.setTextColor(46,96,70);pdf.text('YOUR LIFT SARL - VERSION DE TEST',105,284,{align:'center'});
 pdf.setFont('helvetica','normal');pdf.setTextColor(115,125,119);
 pdf.text('Aucune signature - aucune donnee reelle - non valable comme devis officiel',105,290,{align:'center'});
 }
 const safe=d.customer.replace(/[^a-z0-9_-]+/gi,'-').slice(0,50)||'Client';
 pdf.save('DEVIS-TEST-'+safe+'.pdf');message('PDF de simulation généré localement. Aucun devis enregistré.');
}
$('add').onclick=()=>{addRow();update()};
$('calculate').onclick=update;
$('reset').onclick=startNew;
$('customer').addEventListener('input',update);
$('basis').addEventListener('change',update);
$('rate').addEventListener('input',update);
$('confirm').onchange=()=>{const yes=$('confirm').checked&&last?.taxReady;$('pdf').disabled=!yes;$('print').disabled=!yes};
$('pdf').onclick=downloadPDF;
$('print').onclick=()=>{if($('confirm').checked&&last?.taxReady)window.print()};
addRow({product:'Variateur',quantity:3,unit_price:700});update();fromToken();
})();