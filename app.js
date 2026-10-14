/* Rokomari Inventory — frontend-only edition. No backend, API, or Supabase. */
const $ = id => document.getElementById(id);
const STORE_KEY = "rokomari_inventory_frontend_v1";
const emptyState = { products: [], sales: [], financials: {}, expenses: [] };
let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    return saved && Array.isArray(saved.products) ? {...emptyState, ...saved} : structuredClone(emptyState);
  } catch (_) { return structuredClone(emptyState); }
}
function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (_) { message("ব্রাউজারে ডেটা সংরক্ষণ করা যায়নি। Storage খালি করুন বা অন্য ব্রাউজার ব্যবহার করুন।", true); }
}
function show(id, yes=true) { $(id).classList.toggle("hidden", !yes); }
function message(text, error=false) { $("message").textContent=text; $("message").className=error?"error":"ok"; }
function esc(v) { return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function money(v) { return Number(v || 0).toLocaleString("bn-BD",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function dateLabel(v) { return new Date(v).toLocaleString("bn-BD"); }

function render() {
  const products = state.products;
  $("productsArea").innerHTML = products.length
    ? `<table><thead><tr><th>পণ্য</th><th>কোড</th><th>স্টক</th><th>অ্যাকশন</th></tr></thead><tbody>${products.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.sku||"—")}</td><td class="qty">${p.quantity}</td><td><button class="secondary" data-edit="${p.id}" type="button">স্টক বদল</button> <button class="danger" data-delete="${p.id}" type="button">মুছুন</button></td></tr>`).join("")}</tbody></table>`
    : "এখনো কোনো পণ্য নেই। উপরের ফর্ম থেকে পণ্য যোগ করুন।";
  const options = products.map(p=>`<option value="${p.id}">${esc(p.name)} (স্টক: ${p.quantity})</option>`).join("");
  $("saleProduct").innerHTML = `<option value="">পণ্য বাছাই করুন</option>${options}`;
  $("financeProduct").innerHTML = `<option value="">পণ্য বাছাই করুন</option>${options}`;
  $("salesArea").innerHTML = state.sales.length
    ? `<table><thead><tr><th>তারিখ</th><th>পণ্য</th><th>পরিমাণ</th><th>ফোন</th></tr></thead><tbody>${state.sales.slice().reverse().slice(0,100).map(s=>`<tr><td>${dateLabel(s.created_at)}</td><td>${esc(s.product_name)}</td><td>${s.quantity}</td><td>${esc(s.customer_phone||"—")}</td></tr>`).join("")}</tbody></table>`
    : "কোনো বিক্রয় নেই।";
  renderFinance();
}
function renderFinance() {
  const prices = state.products.filter(p=>state.financials[p.id]);
  $("financeArea").innerHTML = `<h3>পণ্যের মূল্য</h3>${prices.length
    ? `<table><thead><tr><th>পণ্য</th><th>ক্রয়মূল্য</th><th>বিক্রয়মূল্য</th></tr></thead><tbody>${prices.map(p=>`<tr><td>${esc(p.name)}</td><td>${money(state.financials[p.id].buy_price)} টাকা</td><td>${money(state.financials[p.id].sell_price)} টাকা</td></tr>`).join("")}</tbody></table>`
    : "<p>এখনো কোনো পণ্যের মূল্য যোগ করা হয়নি।</p>"}<h3 class="topgap">খরচের তালিকা</h3>${state.expenses.length
    ? `<table><thead><tr><th>তারিখ</th><th>বিবরণ</th><th>টাকা</th><th></th></tr></thead><tbody>${state.expenses.slice().reverse().map(x=>`<tr><td>${dateLabel(x.created_at)}</td><td>${esc(x.note)}</td><td>${money(x.amount)}</td><td><button class="danger" data-expense-delete="${x.id}" type="button">মুছুন</button></td></tr>`).join("")}</tbody></table>`
    : "<p>কোনো খরচ নেই।</p>"}`;
}
$("productForm").addEventListener("submit", e => {
  e.preventDefault();
  const name=$("pName").value.trim(), sku=$("pSku").value.trim(), quantity=Number($("pQty").value);
  if(!name || !Number.isInteger(quantity) || quantity<0) return message("পণ্যের নাম ও সঠিক স্টক দিন।",true);
  if(sku && state.products.some(p=>p.sku.toLowerCase()===sku.toLowerCase())) return message("এই SKU/কোড আগে ব্যবহার করা হয়েছে।",true);
  state.products.push({id:String(Date.now())+Math.random().toString(16).slice(2,6),name,sku,quantity,created_at:new Date().toISOString()});
  persist(); e.target.reset(); $("pQty").value=0; render(); message("পণ্য যোগ হয়েছে।");
});
$("saleForm").addEventListener("submit", e => {
  e.preventDefault();
  const p=state.products.find(x=>x.id===$("saleProduct").value), quantity=Number($("saleQty").value), phone=$("customerPhone").value.trim();
  if(!p) return message("আগে পণ্য যোগ করে বাছাই করুন।",true);
  if(!Number.isInteger(quantity)||quantity<1) return message("বিক্রির পরিমাণ সঠিক দিন।",true);
  if(quantity>p.quantity) return message("স্টকের চেয়ে বেশি বিক্রি করা যাবে না।",true);
  p.quantity-=quantity;
  state.sales.push({id:String(Date.now()),product_id:p.id,product_name:p.name,quantity,customer_phone:phone,created_at:new Date().toISOString()});
  persist(); e.target.reset(); render(); message("বিক্রি সংরক্ষণ হয়েছে এবং স্টক কমানো হয়েছে।");
});
$("financeForm").addEventListener("submit", e => {
  e.preventDefault();
  const id=$("financeProduct").value;
  if(!id || !state.products.some(p=>p.id===id)) return message("একটি পণ্য বাছাই করুন।",true);
  state.financials[id]={buy_price:Number($("buyPrice").value),sell_price:Number($("sellPrice").value)};
  persist(); renderFinance(); e.target.reset(); message("পণ্যের মূল্য সংরক্ষণ হয়েছে।");
});
$("expenseForm").addEventListener("submit", e => {
  e.preventDefault();
  const note=$("expenseNote").value.trim(), amount=Number($("expenseAmount").value);
  if(!note || !Number.isFinite(amount) || amount<=0) return message("খরচের বিবরণ ও সঠিক টাকা দিন।",true);
  state.expenses.push({id:String(Date.now()),note,amount,created_at:new Date().toISOString()});
  persist(); renderFinance(); e.target.reset(); message("খরচ সংরক্ষণ হয়েছে।");
});
$("refreshBtn").addEventListener("click",()=>{state=loadState();render();message("ডেটা রিফ্রেশ হয়েছে।");});
document.addEventListener("click", e => {
  const edit=e.target.closest("[data-edit]");
  if(edit) {
    const p=state.products.find(x=>x.id===edit.dataset.edit); if(!p)return;
    const raw=prompt(`"${p.name}"-এর নতুন মোট স্টক লিখুন:`,String(p.quantity));
    if(raw===null)return; const n=Number(raw);
    if(!Number.isInteger(n)||n<0)return message("০ বা তার বেশি পূর্ণসংখ্যা দিন।",true);
    p.quantity=n;persist();render();message("স্টক আপডেট হয়েছে।");return;
  }
  const del=e.target.closest("[data-delete]");
  if(del) {
    const p=state.products.find(x=>x.id===del.dataset.delete);if(!p)return;
    if(!confirm(`"${p.name}" পণ্যটি মুছে ফেলবেন? বিক্রয় ইতিহাসে পুরোনো তথ্য থাকবে।`))return;
    state.products=state.products.filter(x=>x.id!==p.id);delete state.financials[p.id];persist();render();message("পণ্য মুছে ফেলা হয়েছে।");return;
  }
  const ex=e.target.closest("[data-expense-delete]");
  if(ex) {
    if(!confirm("এই খরচের রেকর্ড মুছবেন?"))return;
    state.expenses=state.expenses.filter(x=>x.id!==ex.dataset.expenseDelete);persist();renderFinance();message("খরচের রেকর্ড মুছে ফেলা হয়েছে।");
  }
});
render();
