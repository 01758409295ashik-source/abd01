/* Rokomari Inventory. Uses only Supabase URL + publishable/anon key in the browser. */
let sb = null, currentUser = null, currentRole = "employee", products = [];
const $ = id => document.getElementById(id);
const show = (id, yes=true) => $(id).classList.toggle("hidden", !yes);
function message(text, error=false){$("message").textContent=text;$("message").className=error?"error":"ok";}
function esc(v){return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function config(){return {url:localStorage.getItem("ri_url"),key:localStorage.getItem("ri_key")};}
function startClient(){
  const c=config();
  if(!c.url||!c.key){show("setupCard");show("authCard",false);show("app",false);return;}
  try{sb=window.supabase.createClient(c.url,c.key);}catch(e){show("setupCard");alert("Project URL বা key ঠিক আছে কি না দেখুন।");return;}
  show("setupCard",false);
  sb.auth.getSession().then(({data})=>{if(data.session){currentUser=data.session.user;openApp();}else{show("authCard");show("app",false);show("logoutBtn",false);}});
}
$("saveConfig").onclick=()=>{
 const url=$("projectUrl").value.trim().replace(/\/+$/,""), key=$("publishableKey").value.trim();
 if(!/^https:\/\/.+\.supabase\.co$/.test(url)||!key){alert("সঠিক Supabase Project URL এবং publishable key দিন।");return;}
 localStorage.setItem("ri_url",url);localStorage.setItem("ri_key",key);startClient();
};
$("changeConfig").onclick=()=>{const c=config();$("projectUrl").value=c.url||"";$("publishableKey").value=c.key||"";show("setupCard");show("authCard",false);};
$("loginBtn").onclick=async()=>{const {error,data}=await sb.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)return alert(error.message);currentUser=data.user;openApp();};
$("signupBtn").onclick=async()=>{const {error}=await sb.auth.signUp({email:$("email").value.trim(),password:$("password").value});if(error)return alert(error.message);alert("সাইনআপ অনুরোধ পাঠানো হয়েছে। ইমেইল ভেরিফিকেশন লাগতে পারে। এরপর লগইন করুন।");};
$("logoutBtn").onclick=async()=>{if(sb)await sb.auth.signOut();currentUser=null;show("app",false);show("authCard");show("logoutBtn",false);};
$("refreshBtn").onclick=loadAll;
async function openApp(){
 show("authCard",false);show("app");show("logoutBtn");$("welcomeTitle").textContent="ড্যাশবোর্ড"; 
 const {data:roleRow,error}=await sb.from("user_roles").select("role").eq("user_id",currentUser.id).maybeSingle();
 if(error){message("Role পড়া যায়নি: "+error.message,true);return;}
 currentRole=roleRow?.role||"employee";$("roleLabel").textContent="লগইন: "+currentUser.email+" • ভূমিকা: "+(currentRole==="admin"?"অ্যাডমিন":"কর্মচারী");
 show("financeCard",currentRole==="admin");
 await loadAll();
}
async function loadAll(){
 const {data,error}=await sb.from("products").select("id,name,sku,quantity,created_at").order("created_at",{ascending:false});
 if(error){message("পণ্য লোড হয়নি: "+error.message,true);return;}
 products=data||[];

 $("productsArea").innerHTML=products.length?`<table><thead><tr><th>পণ্য</th><th>কোড</th><th>স্টক</th></tr></thead><tbody>${products.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.sku||"—")}</td><td class="qty">${esc(p.quantity)}</td></tr>`).join("")}</tbody></table>`:"এখনো কোনো পণ্য নেই।";
 const options=products.map(p=>`<option value="${p.id}">${esc(p.name)} (স্টক: ${p.quantity})</option>`).join("");
 $("saleProduct").innerHTML=options;$("financeProduct").innerHTML=options;
 const {data:sales,error:se}=await sb.from("sales").select("id,product_id,quantity,customer_phone,created_at,products(name)").order("created_at",{ascending:false}).limit(100);
 if(se){$("salesArea").textContent="বিক্রয় ইতিহাস পড়া যায়নি।";}else{$("salesArea").innerHTML=(sales||[]).length?`<table><thead><tr><th>তারিখ</th><th>পণ্য</th><th>পরিমাণ</th><th>ফোন</th></tr></thead><tbody>${sales.map(s=>`<tr><td>${new Date(s.created_at).toLocaleString("bn-BD")}</td><td>${esc(s.products?.name||"পণ্য #"+s.product_id)}</td><td>${s.quantity}</td><td>${esc(s.customer_phone||"—")}</td></tr>`).join("")}</tbody></table>`:"কোনো বিক্রয় নেই।";}
 if(currentRole==="admin") await loadFinance();
}
$("productForm").onsubmit=async e=>{
 e.preventDefault();const name=$("pName").value.trim(),sku=$("pSku").value.trim()||null,quantity=Number($("pQty").value);
 const {error}=await sb.rpc("create_product",{p_name:name,p_sku:sku,p_quantity:quantity});
 if(error){message("পণ্য যোগ হয়নি: "+error.message,true);return;}
 e.target.reset();$("pQty").value=0;message("পণ্য যোগ হয়েছে।");await loadAll();
};
$("saleForm").onsubmit=async e=>{
 e.preventDefault();const productId=Number($("saleProduct").value),quantity=Number($("saleQty").value),phone=$("customerPhone").value.trim()||null;
 if(!productId)return alert("আগে পণ্য যোগ করুন।");
 const {error}=await sb.rpc("record_sale",{p_product_id:productId,p_quantity:quantity,p_customer_phone:phone});
 if(error){message("বিক্রি সংরক্ষণ হয়নি: "+error.message,true);return;}
 e.target.reset();message("বিক্রি সংরক্ষণ হয়েছে এবং স্টক আপডেট হয়েছে।");await loadAll();
};
$("financeForm").onsubmit=async e=>{
 e.preventDefault();if(currentRole!=="admin")return;
 const {error}=await sb.rpc("upsert_product_financials",{p_product_id:Number($("financeProduct").value),p_buy_price:Number($("buyPrice").value),p_sell_price:Number($("sellPrice").value)});
 if(error){message("মূল্য সংরক্ষণ হয়নি: "+error.message,true);return;}
 message("মূল্য সংরক্ষণ হয়েছে।");await loadFinance();
};
$("expenseForm").onsubmit=async e=>{
 e.preventDefault();if(currentRole!=="admin")return;
 const {error}=await sb.rpc("add_expense",{p_note:$("expenseNote").value.trim(),p_amount:Number($("expenseAmount").value)});
 if(error){message("খরচ সংরক্ষণ হয়নি: "+error.message,true);return;}
 e.target.reset();message("খরচ সংরক্ষণ হয়েছে।");await loadFinance();
};
async function loadFinance(){
 const {data:prices,error}=await sb.from("product_financials").select("product_id,buy_price,sell_price,products(name)");
 const {data:expenses,error:ee}=await sb.from("expenses").select("note,amount,created_at").order("created_at",{ascending:false}).limit(50);
 if(error||ee){$("financeArea").textContent="হিসাব পড়া যায়নি। SQL setup ও admin role যাচাই করুন।";return;}
 $("financeArea").innerHTML=`<h3>পণ্যের মূল্য</h3>${(prices||[]).length?`<table><thead><tr><th>পণ্য</th><th>ক্রয়মূল্য</th><th>বিক্রয়মূল্য</th></tr></thead><tbody>${prices.map(p=>`<tr><td>${esc(p.products?.name||"পণ্য")}</td><td>${Number(p.buy_price).toFixed(2)}</td><td>${Number(p.sell_price).toFixed(2)}</td></tr>`).join("")}</tbody></table>`:"কোনো মূল্য সংরক্ষণ করা হয়নি।"}<h3 class="topgap">খরচের তালিকা</h3>${(expenses||[]).length?`<table><thead><tr><th>তারিখ</th><th>বিবরণ</th><th>টাকা</th></tr></thead><tbody>${expenses.map(x=>`<tr><td>${new Date(x.created_at).toLocaleString("bn-BD")}</td><td>${esc(x.note)}</td><td>${Number(x.amount).toFixed(2)}</td></tr>`).join("")}</tbody></table>`:"কোনো খরচ নেই।"}`;
}
startClient();