const $ = (s) => document.querySelector(s);
const itemsEl = $("#items");
const subtotalDisplay = $("#subtotalDisplay");
const taxDisplay = $("#taxDisplay");
const totalDisplay = $("#totalDisplay");
const preview = $("#preview");

const fields = ["fromName","fromEmail","fromAddress","fromPhone","logoUrl","clientName","clientEmail","clientAddress","invoiceNumber","issueDate","dueDate","currency","taxRate","notes"];

function defaults(){
  const t=new Date(); const due=new Date(); due.setDate(t.getDate()+14);
  $("#issueDate").valueAsDate=t; $("#dueDate").valueAsDate=due;
}
function currencySymbol(c){ return ({USD:"$",EUR:"€",GBP:"£",CAD:"$"})[c]||"$"; }
function fmt(n, c){
  const sym=currencySymbol(c);
  return sym + Number(n||0).toFixed(2);
}
function getData(){
  const data={};
  fields.forEach(k=> data[k]= $(`#${k}`).value.trim());
  data.items = [...itemsEl.querySelectorAll(".item-row")].map(r=>({
    name: r.querySelector(".i-name").value.trim(),
    qty: parseFloat(r.querySelector(".i-qty").value)||0,
    rate: parseFloat(r.querySelector(".i-rate").value)||0,
  })).filter(x=> x.name || x.qty || x.rate);
  if(data.items.length===0) data.items=[{name:"Design work", qty:1, rate:500}];
  data.taxRate = parseFloat(data.taxRate)||0;
  return data;
}
function calc(data){
  const subtotal = data.items.reduce((s,it)=> s + (it.qty*it.rate),0);
  const tax = subtotal * (data.taxRate/100);
  const total = subtotal + tax;
  return {subtotal,tax,total};
}
function renderPreview(){
  const d=getData();
  const {subtotal,tax,total}=calc(d);
  subtotalDisplay.textContent=fmt(subtotal,d.currency);
  taxDisplay.textContent=fmt(tax,d.currency);
  totalDisplay.textContent=fmt(total,d.currency);

  const rows = d.items.map(it=>{
    const amt = it.qty*it.rate;
    return `<tr><td>${esc(it.name||"Item")}</td><td class="r">${it.qty}</td><td class="r">${fmt(it.rate,d.currency)}</td><td class="r">${fmt(amt,d.currency)}</td></tr>`
  }).join("");

  preview.innerHTML = `
    <div class="inv-head">
      <div>
        <div class="badge">INVOICE ${esc(d.invoiceNumber||"INV-1001")}</div>
        <h3 style="margin-top:8px">${esc(d.fromName||"Your Business")}</h3>
        <div class="muted" style="font-size:13px; line-height:1.5">
          ${esc(d.fromAddress||"")}${d.fromAddress?"<br>":""}${esc(d.fromEmail||"")}${d.fromEmail&&d.fromPhone?" • ":""}${esc(d.fromPhone||"")}
        </div>
      </div>
      <div style="text-align:right">
        ${d.logoUrl? `<img src="${escAttr(d.logoUrl)}" alt="logo" style="max-width:120px; max-height:56px; object-fit:contain; border:1px solid #e2e8f0; border-radius:8px; padding:4px; background:#fff" onerror="this.style.display='none'">`:""}
        <div class="muted" style="font-size:13px; margin-top:6px">
          Issue: ${esc(d.issueDate||"")}<br>Due: ${esc(d.dueDate||"")}
        </div>
      </div>
    </div>

    <div class="two-col">
      <div>
        <div class="muted" style="font-size:12px; letter-spacing:.06em; text-transform:uppercase">Bill To</div>
        <div style="font-weight:700">${esc(d.clientName||"Client Name")}</div>
        <div class="muted" style="font-size:13px; line-height:1.5">${esc(d.clientAddress||"")}${d.clientAddress?"<br>":""}${esc(d.clientEmail||"")}</div>
      </div>
      <div style="text-align:right">
        <div class="muted" style="font-size:12px; letter-spacing:.06em; text-transform:uppercase">Amount Due</div>
        <div style="font-size:22px; font-weight:800">${fmt(total,d.currency)}</div>
        <div class="muted" style="font-size:12px">${d.currency} • Tax ${d.taxRate||0}%</div>
      </div>
    </div>

    <table class="table">
      <thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="total-box">
      <div><span>Subtotal</span><strong>${fmt(subtotal,d.currency)}</strong></div>
      <div><span>Tax (${d.taxRate||0}%)</span><strong>${fmt(tax,d.currency)}</strong></div>
      <div class="grandTotal"><span>Total</span><span>${fmt(total,d.currency)}</span></div>
    </div>

    ${d.notes? `<div style="margin-top:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:13px; color:#334155"><strong>Notes:</strong> ${esc(d.notes)}</div>`:""}
    <div class="muted" style="font-size:11px; margin-top:10px">Thank you for your business!</div>
  `;
}

function esc(s){ return String(s).replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escAttr(s){ return esc(s).replace(/`/g,'&#96;'); }

function addItem(pref={}){
  const row=document.createElement("div");
  row.className="item-row";
  row.innerHTML=`
    <label>Description<input class="i-name" placeholder="Website design" value="${escAttr(pref.name||"")}" ></label>
    <label>Qty<input class="i-qty" type="number" min="0" step="0.01" value="${pref.qty??1}"></label>
    <label>Rate<input class="i-rate" type="number" min="0" step="0.01" value="${pref.rate??500}"></label>
    <label>Amount<input class="amt" disabled></label>
    <button type="button" class="btn remove" title="Remove">✕</button>
  `;
  const qty=row.querySelector(".i-qty"), rate=row.querySelector(".i-rate"), amt=row.querySelector(".amt");
  const updateAmt=()=>{ amt.value = fmt((parseFloat(qty.value)||0)*(parseFloat(rate.value)||0), $("#currency").value); renderPreview(); };
  row.querySelectorAll("input").forEach(i=> i.addEventListener("input", updateAmt));
  row.querySelector(".remove").addEventListener("click", ()=>{ row.remove(); renderPreview(); });
  itemsEl.appendChild(row);
  updateAmt();
}

function bind(){
  fields.forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener("input", renderPreview);
    if(el && el.type==="date") el.addEventListener("change", renderPreview);
    if(el && el.tagName==="SELECT") el.addEventListener("change", renderPreview);
  });
  $("#addItemBtn").addEventListener("click", ()=> addItem());
  $("#downloadBtn").addEventListener("click", downloadPdf);
  $("#printBtn").addEventListener("click", ()=> window.print());
  $("#resetBtn").addEventListener("click", resetAll);
}

function resetAll(){
  ["fromName","fromEmail","fromAddress","fromPhone","logoUrl","clientName","clientEmail","clientAddress","invoiceNumber","notes"].forEach(id=> $(`#${id}`).value="");
  $("#fromName").value="Rexford Studio"; $("#fromEmail").value="rexford.elliss@gmail.com"; $("#fromAddress").value="Houston, TX"; $("#currency").value="USD"; $("#taxRate").value="0"; $("#notes").value="Thank you for your business!";
  defaults();
  itemsEl.innerHTML=""; addItem({name:"Design work", qty:1, rate:500}); addItem({name:"Revisions", qty:2, rate:75});
  renderPreview();
}

async function downloadPdf(){
  const { jsPDF } = window.jspdf;
  const d=getData(); const {subtotal,tax,total}=calc(d);
  const doc=new jsPDF({unit:"pt", format:"a4"});
  const W=doc.internal.pageSize.getWidth(), M=48; let y=M;

  doc.setFillColor(15,23,42); doc.rect(0,0,W,70,"F");
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(18);
  doc.text(d.fromName||"Your Business", M, 32);
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(226,232,240);
  doc.text((d.fromEmail||"") + (d.fromPhone? " • "+d.fromPhone:""), M, 48);
  if(d.fromAddress){ doc.text(d.fromAddress, M, 60); }
  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(255,255,255);
  doc.text(`INVOICE ${d.invoiceNumber||""}`, W-M, 32, {align:"right"});
  doc.setFont("helvetica","normal"); doc.setFontSize(9);
  doc.text(`Issue: ${d.issueDate||""}   Due: ${d.dueDate||""}`, W-M, 48, {align:"right"});

  y=90; doc.setTextColor(15,23,42);
  doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(100,116,139);
  doc.text("BILL TO", M, y); doc.text("AMOUNT DUE", W-M, y, {align:"right"});
  y+=14; doc.setTextColor(15,23,42); doc.setFontSize(11);
  doc.text(d.clientName||"Client Name", M, y);
  doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text(fmt(total,d.currency), W-M, y, {align:"right"});
  y+=14; doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(71,85,105);
  if(d.clientAddress) { doc.text(d.clientAddress, M, y); y+=12; }
  if(d.clientEmail) { doc.text(d.clientEmail, M, y); y+=12; }
  doc.setFontSize(9); doc.setTextColor(100,116,139);
  doc.text(`${d.currency} • Tax ${d.taxRate||0}%`, W-M, y-14, {align:"right"});

  y+=8;
  doc.setFillColor(248,250,252); doc.rect(M, y, W-M*2, 22, "F");
  doc.setDrawColor(226,232,240); doc.rect(M, y, W-M*2, 22, "S");
  doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(100,116,139);
  doc.text("DESCRIPTION", M+8, y+14);
  doc.text("QTY", W-220, y+14, {align:"right"});
  doc.text("RATE", W-150, y+14, {align:"right"});
  doc.text("AMOUNT", W-M-8, y+14, {align:"right"});
  y+=22;

  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(15,23,42);
  d.items.forEach((it,i)=>{
    const amt=it.qty*it.rate;
    const h=20;
    if(i%2===1){ doc.setFillColor(249,250,251); doc.rect(M, y, W-M*2, h, "F"); }
    doc.text(it.name||"Item", M+8, y+13);
    doc.text(String(it.qty), W-220, y+13, {align:"right"});
    doc.text(fmt(it.rate,d.currency), W-150, y+13, {align:"right"});
    doc.text(fmt(amt,d.currency), W-M-8, y+13, {align:"right"});
    doc.setDrawColor(241,245,249); doc.line(M, y+h, W-M, y+h);
    y+=h;
    if(y>760){ doc.addPage(); y=M; }
  });

  y+=10;
  const boxW=220, boxX=W-M-boxW;
  doc.setDrawColor(226,232,240); doc.rect(boxX, y, boxW, 72);
  doc.setFontSize(9);
  doc.text("Subtotal", boxX+10, y+18); doc.text(fmt(subtotal,d.currency), boxX+boxW-10, y+18, {align:"right"});
  doc.line(boxX, y+26, boxX+boxW, y+26);
  doc.text(`Tax (${d.taxRate||0}%)`, boxX+10, y+40); doc.text(fmt(tax,d.currency), boxX+boxW-10, y+40, {align:"right"});
  doc.line(boxX, y+48, boxX+boxW, y+48);
  doc.setFillColor(15,23,42); doc.rect(boxX, y+48, boxW, 24, "F");
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold");
  doc.text("Total", boxX+10, y+64); doc.text(fmt(total,d.currency), boxX+boxW-10, y+64, {align:"right"});
  doc.setTextColor(15,23,42); doc.setFont("helvetica","normal");
  y+=84;

  if(d.notes){
    doc.setFillColor(248,250,252); doc.setDrawColor(226,232,240);
    const lines=doc.splitTextToSize(`Notes: ${d.notes}`, W-M*2-16);
    const h=16+ lines.length*12;
    if(y+h>780){ doc.addPage(); y=M; }
    doc.rect(M, y, W-M*2, h, "FD");
    doc.setFontSize(9); doc.setTextColor(51,65,85);
    doc.text(lines, M+8, y+14);
    y+=h+10;
  }
  doc.setFontSize(8); doc.setTextColor(148,163,184);
  doc.text("Thank you for your business!", M, 820);

  doc.save(`${d.invoiceNumber||"invoice"}.pdf`);
}

defaults();
bind();
itemsEl.innerHTML="";
addItem({name:"Website design", qty:1, rate:800});
addItem({name:"Revisions", qty:2, rate:75});
renderPreview();
