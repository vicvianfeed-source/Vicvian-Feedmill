const SKEY = "vicvian_feedmill_v1";
const C = "₦";
const CO = "Vicvian Feedmill";

const PBLANK = { products:{view:false,add:false,edit:false,del:false}, inventory:{view:false,adjust:false}, sales:{view:false,record:false}, invoices:{view:false,create:false,mark:false} };
const PALL   = { products:{view:true,add:true,edit:true,del:true}, inventory:{view:true,adjust:true}, sales:{view:true,record:true}, invoices:{view:true,create:true,mark:true} };
const PVIEW  = { products:{view:true,add:false,edit:false,del:false}, inventory:{view:true,adjust:false}, sales:{view:true,record:false}, invoices:{view:true,create:false,mark:false} };

const SEED = {
  products:[
    {id:"p1",name:"Broiler Starter Mash",cat:"Poultry",unit:"50kg bag",price:18500,cost:14000,thresh:20},
    {id:"p2",name:"Layer Pellets",cat:"Poultry",unit:"50kg bag",price:16500,cost:12000,thresh:15},
    {id:"p3",name:"Pig Grower Meal",cat:"Swine",unit:"50kg bag",price:15000,cost:11000,thresh:10},
    {id:"p4",name:"Dairy Concentrate",cat:"Cattle",unit:"50kg bag",price:22000,cost:16000,thresh:12},
    {id:"p5",name:"Sheep & Goat Lick",cat:"Small Stock",unit:"25kg block",price:11000,cost:7500,thresh:8},
  ],
  stock:{p1:145,p2:12,p3:8,p4:67,p5:3},
  sales:[
    {id:"s1",date:"2026-05-01",pid:"p1",qty:20,price:18500,customer:"Sunrise Farm"},
    {id:"s2",date:"2026-05-03",pid:"p2",qty:15,price:16500,customer:"Green Valley Farms"},
    {id:"s3",date:"2026-05-05",pid:"p4",qty:10,price:22000,customer:"Mthembu Dairy"},
    {id:"s4",date:"2026-05-08",pid:"p1",qty:30,price:18500,customer:"Sunrise Farm"},
    {id:"s5",date:"2026-05-10",pid:"p3",qty:12,price:15000,customer:"Pork Palace Ltd"},
  ],
  invoices:[
    {id:"INV-001",date:"2026-05-01",customer:"Sunrise Farm",items:[{pid:"p1",qty:20,price:18500}],status:"paid"},
    {id:"INV-002",date:"2026-05-05",customer:"Mthembu Dairy",items:[{pid:"p4",qty:10,price:22000}],status:"pending"},
    {id:"INV-003",date:"2026-05-10",customer:"Pork Palace Ltd",items:[{pid:"p3",qty:12,price:15000}],status:"overdue"},
  ],
  users:[{id:"u_victor",name:"Victor",username:"victor",password:"VicvianAdmin@2024",role:"Admin",active:true,perms:null,email:"victor@vicvianfeedmill.com"}]
};

// ── STATE ──────────────────────────────────────────────────────────────────
let D = null, S = null;
let UI = { tab:"dashboard", form:{}, notice:null, loginErr:null, attempts:0, locked:false };

function loadData() {
  try { const r = localStorage.getItem(SKEY); D = r ? JSON.parse(r) : JSON.parse(JSON.stringify(SEED)); }
  catch { D = JSON.parse(JSON.stringify(SEED)); }
}
function saveData(d) {
  D = d;
  try { localStorage.setItem(SKEY, JSON.stringify(d)); } catch {}
  render();
}

const can = (m,a) => { if(!S)return false; if(S.role==="Admin")return true; return S.perms?.[m]?.[a]??false; };
const fmt = n => `${C}${Number(n).toLocaleString("en-NG",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const uid = () => Math.random().toString(36).slice(2,8);
const toDay = () => new Date().toISOString().slice(0,10);
const cap = s => s.charAt(0).toUpperCase()+s.slice(1);

// ── RENDER ─────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById("app");
  if (!D) { app.innerHTML = `<p style="padding:3rem;text-align:center;color:var(--text2)">Loading...</p>`; return; }
  if (!S) { app.innerHTML = loginUI(); setTimeout(bindLogin, 0); return; }
  app.innerHTML = navBar() + `<div id="content">${tabContent()}</div>`;
  setTimeout(bindApp, 0);
}

// ── LOGIN ──────────────────────────────────────────────────────────────────
function loginUI() {
  return `<div style="min-height:80vh;display:flex;align-items:center;justify-content:center">
    <div class="card" style="width:320px;max-width:100%">
      <div style="text-align:center;margin-bottom:1.75rem">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--green-light);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
          <i class="ti ti-leaf" style="font-size:24px;color:var(--green-dark)"></i>
        </div>
        <div style="font-weight:600;font-size:18px">${CO}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px">
          <i class="ti ti-shield-check" style="font-size:12px;color:var(--green)"></i> Authorised access only
        </div>
      </div>
      ${UI.locked?`<div style="background:var(--red-light);border:0.5px solid #F09595;border-radius:var(--radius);padding:10px 14px;font-size:12px;color:var(--red-dark);margin-bottom:1rem;text-align:center">
        <i class="ti ti-lock"></i> System locked after 5 failed attempts.<br>Contact Victor to reset access.</div>`:""}
      ${UI.loginErr&&!UI.locked?`<div style="background:var(--red-light);border-radius:var(--radius);padding:8px 12px;font-size:12px;color:var(--red-dark);margin-bottom:1rem">
        <i class="ti ti-alert-circle"></i> ${UI.loginErr}</div>`:""}
      <div style="margin-bottom:10px">
        <label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Username</label>
        <input id="l-u" autocomplete="username" placeholder="Enter username" style="width:100%" ${UI.locked?"disabled":""}>
      </div>
      <div style="margin-bottom:1.25rem">
        <label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Password</label>
        <input id="l-p" type="password" autocomplete="current-password" placeholder="Enter password" style="width:100%" ${UI.locked?"disabled":""}>
      </div>
      <button id="btn-login" style="width:100%;padding:10px;font-size:14px;font-weight:500" ${UI.locked?"disabled":""}>
        <i class="ti ti-lock-open"></i> Sign in securely
      </button>
      ${UI.attempts>0&&!UI.locked?`<div style="text-align:center;font-size:11px;color:var(--amber);margin-top:10px">
        <i class="ti ti-alert-triangle"></i> ${5-UI.attempts} attempt${5-UI.attempts===1?"":"s"} remaining</div>`:""}
      <div style="margin-top:1.5rem;padding-top:1rem;border-top:0.5px solid var(--border);font-size:11px;color:var(--text3);text-align:center">
        Unauthorised access is prohibited.<br>All activity is monitored and logged.
      </div>
    </div>
  </div>`;
}

function bindLogin() {
  const go = () => {
    if (UI.locked) return;
    const u = (document.getElementById("l-u")?.value||"").trim().toLowerCase();
    const p = document.getElementById("l-p")?.value||"";
    const user = D.users.find(x => x.username.toLowerCase()===u && x.password===p && x.active);
    if (user) {
      S = {id:user.id,name:user.name,username:user.username,role:user.role,perms:user.perms};
      UI = {tab:"dashboard",form:{},notice:null,loginErr:null,attempts:0,locked:false};
    } else {
      UI.attempts = (UI.attempts||0)+1;
      UI.locked = UI.attempts >= 5;
      UI.loginErr = UI.locked?"Account locked after 5 failed attempts.":"Incorrect username or password.";
    }
    render();
  };
  document.getElementById("btn-login")?.addEventListener("click", go);
  document.getElementById("l-p")?.addEventListener("keydown", e => { if(e.key==="Enter") go(); });
  document.getElementById("l-u")?.addEventListener("keydown", e => { if(e.key==="Enter") document.getElementById("l-p")?.focus(); });
}

// ── NAV ────────────────────────────────────────────────────────────────────
function navBar() {
  const tabs = [
    {id:"dashboard",icon:"ti-layout-dashboard",label:"Dashboard",show:true},
    {id:"products",icon:"ti-package",label:"Products",show:can("products","view")},
    {id:"inventory",icon:"ti-box",label:"Inventory",show:can("inventory","view")},
    {id:"sales",icon:"ti-chart-bar",label:"Sales",show:can("sales","view")},
    {id:"invoices",icon:"ti-file-text",label:"Invoices",show:can("invoices","view")},
    {id:"users",icon:"ti-users",label:"Users",show:S?.role==="Admin"},
  ].filter(t=>t.show);
  return `<div style="border-bottom:0.5px solid var(--border);margin-bottom:1.25rem;padding-bottom:0" class="no-print">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="width:28px;height:28px;border-radius:50%;background:var(--green-light);display:flex;align-items:center;justify-content:center">
        <i class="ti ti-leaf" style="font-size:14px;color:var(--green-dark)"></i>
      </div>
      <span style="font-weight:600;font-size:15px">${CO}</span>
      <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:var(--text2)">${S?.name}</span>
        <span class="badge" style="background:${S?.role==="Admin"?"var(--purple-light)":"var(--bg2)"};color:${S?.role==="Admin"?"var(--purple-dark)":"var(--text2)"}">${S?.role}</span>
        <button id="btn-logout" style="font-size:12px;padding:4px 10px;color:var(--text2)">
          <i class="ti ti-logout"></i> Sign out
        </button>
      </div>
    </div>
    <div style="display:flex;overflow-x:auto;gap:0">
      ${tabs.map(t=>`<button data-tab="${t.id}" style="background:none;border:none;border-bottom:${UI.tab===t.id?"2px solid var(--green)":"2px solid transparent"};padding:8px 12px;font-size:13px;font-weight:${UI.tab===t.id?"600":"400"};color:${UI.tab===t.id?"var(--text)":"var(--text2)"};border-radius:0;white-space:nowrap;cursor:pointer">
        <i class="ti ${t.icon}" style="font-size:14px;vertical-align:-2px"></i> ${t.label}</button>`).join("")}
    </div>
  </div>`;
}

function tabContent() {
  if(UI.tab==="dashboard") return dashTab();
  if(UI.tab==="products"&&can("products","view")) return productsTab();
  if(UI.tab==="inventory"&&can("inventory","view")) return inventoryTab();
  if(UI.tab==="sales"&&can("sales","view")) return salesTab();
  if(UI.tab==="invoices"&&can("invoices","view")) return invoicesTab();
  if(UI.tab==="users"&&S?.role==="Admin") return usersTab();
  return `<div style="padding:4rem;text-align:center;color:var(--text2)">
    <i class="ti ti-lock" style="font-size:40px;display:block;margin-bottom:12px;color:var(--border2)"></i>
    <div style="font-size:14px">Access restricted</div>
    <div style="font-size:13px;margin-top:6px">Contact Victor to request permission for this section.</div></div>`;
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
function dashTab() {
  const d=D;
  const invV=d.products.reduce((s,p)=>s+(d.stock[p.id]||0)*p.price,0);
  const rev=d.sales.reduce((s,x)=>s+x.qty*x.price,0);
  const gp=rev-d.sales.reduce((s,x)=>{const p=d.products.find(q=>q.id===x.pid);return s+x.qty*(p?.cost||0);},0);
  const out=d.invoices.filter(i=>i.status!=="paid").reduce((s,i)=>s+i.items.reduce((t,it)=>t+it.qty*it.price,0),0);
  const low=d.products.filter(p=>(d.stock[p.id]||0)<=p.thresh);
  const maxR=Math.max(...d.products.map(p=>d.sales.filter(s=>s.pid===p.id).reduce((t,s)=>t+s.qty*s.price,0)),1);
  return `
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px;margin-bottom:1.25rem">
    ${[{l:"Inventory value",v:fmt(invV),i:"ti-box",c:"var(--green)"},{l:"Total revenue",v:fmt(rev),i:"ti-chart-line",c:"var(--amber)"},{l:"Gross profit",v:fmt(gp),i:"ti-trending-up",c:gp>=0?"var(--green)":"var(--red)"},{l:"Outstanding",v:fmt(out),i:"ti-clock",c:"var(--red)"}].map(m=>`
    <div class="metric"><div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><i class="ti ${m.i}" style="font-size:15px;color:${m.c}"></i><span style="font-size:11px;color:var(--text2)">${m.l}</span></div>
    <div style="font-size:19px;font-weight:600">${m.v}</div></div>`).join("")}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <i class="ti ti-alert-triangle" style="color:var(--red)"></i><span style="font-weight:500;font-size:13px">Low stock alerts</span>
        <span class="badge" style="margin-left:auto;background:var(--red-light);color:var(--red-dark)">${low.length}</span>
      </div>
      ${low.length===0?`<p style="font-size:13px;color:var(--text2)">All stock levels are healthy.</p>`:
        low.map(p=>{const q=D.stock[p.id]||0;const pc=Math.round(q/p.thresh*100);return`<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>${p.name}</span><span style="color:var(--red);font-weight:600">${q}/${p.thresh}</span></div>
          <div style="background:var(--bg2);border-radius:4px;height:5px;overflow:hidden"><div style="width:${Math.min(pc,100)}%;height:100%;background:${pc<50?"var(--red)":"var(--amber)"};border-radius:4px"></div></div>
        </div>`;}).join("")}
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><i class="ti ti-receipt" style="color:var(--green)"></i><span style="font-weight:500;font-size:13px">Recent sales</span></div>
      ${[...d.sales].reverse().slice(0,5).map(s=>{const p=d.products.find(x=>x.id===s.pid);return`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:0.5px solid var(--border);font-size:12px">
        <div><div>${p?.name||"—"}</div><div style="color:var(--text2)">${s.customer} · ${s.date}</div></div>
        <div style="font-weight:600;color:var(--green)">${fmt(s.qty*s.price)}</div></div>`;}).join("")}
    </div>
  </div>
  <div class="card">
    <div style="font-weight:500;font-size:13px;margin-bottom:12px">Product performance</div>
    ${d.products.map(p=>{const ps=d.sales.filter(s=>s.pid===p.id);const pr=ps.reduce((t,s)=>t+s.qty*s.price,0);const pu=ps.reduce((t,s)=>t+s.qty,0);const pc=(pr/maxR)*100;const il=(D.stock[p.id]||0)<=p.thresh;
    return`<div style="display:grid;grid-template-columns:170px 1fr 70px 100px;gap:10px;align-items:center;padding:5px 0;border-bottom:0.5px solid var(--border);font-size:12px">
      <div style="display:flex;align-items:center;gap:6px"><span style="width:6px;height:6px;border-radius:50%;background:${il?"var(--red)":"var(--green)"};flex-shrink:0"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</span></div>
      <div style="background:var(--bg2);border-radius:4px;height:6px;overflow:hidden"><div style="width:${pc.toFixed(1)}%;height:100%;background:var(--amber);border-radius:4px"></div></div>
      <div style="text-align:right;color:var(--text2)">${pu} units</div>
      <div style="text-align:right;font-weight:600">${fmt(pr)}</div></div>`;}).join("")}
  </div>`;
}

// ── PRODUCTS ───────────────────────────────────────────────────────────────
function productsTab() {
  const d=D,f=UI.form;
  const CATS=["Poultry","Cattle","Swine","Equine","Small Stock","Game","Other"];
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
    <span style="font-size:13px;color:var(--text2)">${d.products.length} products</span>
    ${can("products","add")?`<button id="btn-add-prod"><i class="ti ti-plus"></i> Add product</button>`:""}
  </div>
  ${UI.notice?`<div style="background:var(--amber-light);border:0.5px solid #FAC775;border-radius:var(--radius);padding:10px 14px;margin-bottom:1rem;font-size:12px;display:flex;align-items:center;gap:8px">
    <i class="ti ti-info-circle" style="color:var(--amber)"></i>
    Price updated for <strong>${UI.notice.name}</strong>: ${fmt(UI.notice.old)} → ${fmt(UI.notice.nw)}. New invoices will use the updated price.
    <button id="btn-dismiss" style="margin-left:auto;font-size:12px;padding:3px 9px">Dismiss</button></div>`:""}
  ${f.pForm?`<div class="card" style="margin-bottom:1rem">
    <div style="font-weight:500;font-size:13px;margin-bottom:12px">${f.editId?"Edit product":"New product"}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Product name</label><input id="pf-n" value="${f.pN||""}" placeholder="e.g. Broiler Starter Mash" style="width:100%"></div>
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Category</label><select id="pf-c" style="width:100%">${CATS.map(c=>`<option${f.pC===c?" selected":""}>${c}</option>`).join("")}</select></div>
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Unit</label><input id="pf-u" value="${f.pU||"50kg bag"}" style="width:100%"></div>
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Selling price (${C})</label><input id="pf-p" type="number" value="${f.pP||""}" placeholder="0.00" style="width:100%"></div>
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Cost price (${C})</label><input id="pf-co" type="number" value="${f.pCo||""}" placeholder="0.00" style="width:100%"></div>
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Low stock threshold</label><input id="pf-t" type="number" value="${f.pT||10}" style="width:100%"></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button id="btn-save-prod" style="font-weight:500">Save product</button>
      <button id="btn-cancel-prod">Cancel</button>
    </div>
  </div>`:""}
  <div class="card" style="padding:0;overflow:hidden">
    <table>
      <thead><tr style="background:var(--bg2)">${["Product","Category","Unit","Sell price","Cost","Margin","Threshold",""].map(h=>`<th style="padding:8px 10px;text-align:left;font-weight:500;font-size:12px;color:var(--text2);border-bottom:0.5px solid var(--border)">${h}</th>`).join("")}</tr></thead>
      <tbody>${d.products.map((p,i)=>{const mg=((p.price-p.cost)/p.price*100).toFixed(1);
      return`<tr style="border-bottom:${i<d.products.length-1?"0.5px solid var(--border)":"none"}">
        <td style="padding:9px 10px;font-weight:500">${p.name}</td>
        <td style="padding:9px 10px"><span class="badge" style="background:var(--bg2);color:var(--text2)">${p.cat}</span></td>
        <td style="padding:9px 10px;color:var(--text2)">${p.unit}</td>
        <td style="padding:9px 10px;font-weight:600">${fmt(p.price)}</td>
        <td style="padding:9px 10px;color:var(--text2)">${fmt(p.cost)}</td>
        <td style="padding:9px 10px;color:${Number(mg)>20?"var(--green-dark)":Number(mg)>10?"var(--amber)":"var(--red)"};font-weight:600">${mg}%</td>
        <td style="padding:9px 10px;color:var(--text2)">${p.thresh}</td>
        <td style="padding:9px 10px">
          <div style="display:flex;gap:5px">
          ${can("products","edit")?`<button data-edit-p="${p.id}" style="font-size:11px;padding:4px 8px"><i class="ti ti-edit"></i></button>`:""}
          ${can("products","del")?`<button data-del-p="${p.id}" style="font-size:11px;padding:4px 8px;color:var(--red)"><i class="ti ti-trash"></i></button>`:""}
          </div>
        </td>
      </tr>`;}).join("")}</tbody>
    </table>
  </div>`;
}

// ── INVENTORY ──────────────────────────────────────────────────────────────
function inventoryTab() {
  const d=D,f=UI.form;
  const sv=d.products.reduce((s,p)=>s+(d.stock[p.id]||0)*p.price,0);
  const cv=d.products.reduce((s,p)=>s+(d.stock[p.id]||0)*p.cost,0);
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:1.25rem">
    ${[{l:"Stock value (sell)",v:fmt(sv),i:"ti-coins"},{l:"Stock value (cost)",v:fmt(cv),i:"ti-building-store"},
      {l:"Low stock items",v:d.products.filter(p=>(d.stock[p.id]||0)<=p.thresh).length,i:"ti-alert-triangle"},{l:"Total SKUs",v:d.products.length,i:"ti-list"}].map(m=>`
    <div class="metric"><div style="font-size:11px;color:var(--text2);display:flex;align-items:center;gap:5px;margin-bottom:6px"><i class="ti ${m.i}"></i>${m.l}</div>
    <div style="font-size:19px;font-weight:600">${m.v}</div></div>`).join("")}
  </div>
  <div class="card" style="padding:0">
    ${d.products.map((p,i)=>{const q=d.stock[p.id]||0;const il=q<=p.thresh;const io=q===0;const pc=Math.min(100,(q/(p.thresh*3))*100);const ia=f.adjId===p.id;
    return`<div style="border-bottom:${i<d.products.length-1?"0.5px solid var(--border)":"none"};padding:12px 16px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span style="font-weight:500;font-size:13px">${p.name}</span>
            <span style="font-size:11px;color:var(--text2)">${p.cat}</span>
            ${io?`<span class="badge" style="background:var(--red-light);color:var(--red-dark)">Out of stock</span>`:""}
            ${!io&&il?`<span class="badge" style="background:var(--amber-light);color:#633806">Low stock</span>`:""}
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="flex:1;background:var(--bg2);border-radius:4px;height:6px;overflow:hidden">
              <div style="width:${pc.toFixed(1)}%;height:100%;background:${io?"var(--red)":il?"var(--amber)":"var(--green)"};border-radius:4px"></div>
            </div>
            <span style="font-size:13px;font-weight:600;min-width:80px;text-align:right">${q} <span style="color:var(--text2);font-weight:400">${p.unit}s</span></span>
          </div>
          <div style="font-size:11px;color:var(--text2);margin-top:3px">Threshold: ${p.thresh} · Value: ${fmt(q*p.price)}</div>
        </div>
        ${can("inventory","adjust")?`<button data-adj="${p.id}" style="font-size:12px;padding:5px 10px;flex-shrink:0"><i class="ti ti-adjustments-horizontal"></i> Adjust</button>`:""}
      </div>
      ${ia?`<div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select id="adj-t"><option value="add"${f.adjT==="add"?" selected":""}>Add stock</option><option value="remove"${f.adjT==="remove"?" selected":""}>Remove stock</option><option value="set"${f.adjT==="set"?" selected":""}>Set to</option></select>
        <input id="adj-q" type="number" value="${f.adjQ||""}" placeholder="Qty" style="width:85px" min="0">
        <span style="font-size:12px;color:var(--text2)">${p.unit}s</span>
        <button id="btn-adj-ok" style="font-size:12px">Apply</button>
        <button id="btn-adj-x" style="font-size:12px">Cancel</button>
      </div>`:""}
    </div>`;}).join("")}
  </div>`;
}

// ── SALES ──────────────────────────────────────────────────────────────────
function salesTab() {
  const d=D,f=UI.form;
  const fl=f.sFilter||"all";
  const cats=["all",...new Set(d.products.map(p=>p.cat))];
  const filt=fl==="all"?d.sales:d.sales.filter(s=>d.products.find(p=>p.id===s.pid)?.cat===fl);
  const sp=d.products.find(p=>p.id===f.sPid)||d.products[0];
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
    <div style="display:flex;gap:6px;flex-wrap:wrap">${cats.map(c=>`<button data-sf="${c}" style="font-size:12px;padding:5px 10px;font-weight:${fl===c?"600":"400"};border-color:${fl===c?"var(--border2)":"var(--border)"}">${cap(c)}</button>`).join("")}</div>
    ${can("sales","record")?`<button id="btn-sale-f"><i class="ti ti-plus"></i> Record sale</button>`:""}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:1rem">
    ${[{l:"Revenue",v:fmt(filt.reduce((t,s)=>t+s.qty*s.price,0))},{l:"Units sold",v:filt.reduce((t,s)=>t+s.qty,0)},{l:"Transactions",v:filt.length}].map(m=>`
    <div class="metric"><div style="font-size:11px;color:var(--text2);margin-bottom:4px">${m.l}</div><div style="font-size:19px;font-weight:600">${m.v}</div></div>`).join("")}
  </div>
  ${f.sForm?`<div class="card" style="margin-bottom:1rem">
    <div style="font-weight:500;font-size:13px;margin-bottom:12px">Record new sale</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Product</label>
        <select id="s-pid" style="width:100%">${d.products.map(p=>`<option value="${p.id}"${f.sPid===p.id?" selected":""}>${p.name} — ${fmt(p.price)}</option>`).join("")}</select></div>
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Qty (${sp?.unit}s)</label>
        <input id="s-qty" type="number" value="${f.sQty||""}" placeholder="0" style="width:100%" min="1"></div>
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Customer</label>
        <input id="s-cust" value="${f.sCust||""}" placeholder="Customer name" style="width:100%"></div>
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Date</label>
        <input id="s-date" type="date" value="${f.sDate||toDay()}" style="width:100%"></div>
    </div>
    ${f.sQty&&sp?`<div style="margin-top:8px;font-size:12px;color:var(--text2)">Total: <strong style="color:var(--text)">${fmt(Number(f.sQty)*sp.price)}</strong> · Stock after: <strong>${Math.max(0,(D.stock[sp.id]||0)-Number(f.sQty))} ${sp.unit}s</strong></div>`:""}
    <div style="display:flex;gap:8px;margin-top:12px">
      <button id="btn-rec-sale" style="font-weight:500">Record & generate invoice</button>
      <button id="btn-sale-x">Cancel</button>
    </div>
  </div>`:""}
  <div class="card" style="padding:0;overflow:hidden">
    <table style="font-size:12px">
      <thead><tr style="background:var(--bg2)">${["Date","Product","Customer","Qty","Unit price","Total"].map(h=>`<th style="padding:8px 10px;text-align:left;font-weight:500;color:var(--text2);border-bottom:0.5px solid var(--border)">${h}</th>`).join("")}</tr></thead>
      <tbody>${[...filt].reverse().map((s,i)=>{const p=d.products.find(x=>x.id===s.pid);return`<tr style="border-bottom:${i<filt.length-1?"0.5px solid var(--border)":"none"}">
        <td style="padding:8px 10px;color:var(--text2)">${s.date}</td>
        <td style="padding:8px 10px;font-weight:500">${p?.name||"—"}</td>
        <td style="padding:8px 10px">${s.customer}</td>
        <td style="padding:8px 10px">${s.qty}</td>
        <td style="padding:8px 10px">${fmt(s.price)}</td>
        <td style="padding:8px 10px;font-weight:600;color:var(--green)">${fmt(s.qty*s.price)}</td>
      </tr>`;}).join("")}</tbody>
    </table>
  </div>`;
}

// ── INVOICES ──────────────────────────────────────────────────────────────────
function invoicesTab() {
  const d=D,f=UI.form;
  const SC={paid:{bg:"var(--green-light)",tx:"var(--green-dark)"},pending:{bg:"var(--amber-light)",tx:"#633806"},overdue:{bg:"var(--red-light)",tx:"var(--red-dark)"}};
  if(f.viewInv){
    const inv=d.invoices.find(i=>i.id===f.viewInv);
    if(!inv)return`<button id="btn-inv-back"><i class="ti ti-arrow-left"></i> Back</button>`;
    const sub=inv.items.reduce((t,it)=>t+it.qty*it.price,0),vat=sub*0.075,sc=SC[inv.status]||SC.pending;
    return`<div class="no-print" style="margin-bottom:1rem;display:flex;gap:8px">
      <button id="btn-inv-back"><i class="ti ti-arrow-left"></i> Back to invoices</button>
      <button onclick="window.print()" style="margin-left:auto"><i class="ti ti-printer"></i> Print / Save PDF</button>
    </div>
    <div class="card" style="max-width:580px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem">
        <div><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><i class="ti ti-leaf" style="font-size:16px;color:var(--green)"></i><span style="font-weight:600;font-size:16px">${CO}</span></div>
          <div style="font-size:12px;color:var(--text2)">Agricultural Feed Mill · Nigeria</div></div>
        <div style="text-align:right"><div style="font-size:17px;font-weight:600;margin-bottom:3px">${inv.id}</div>
          <div style="font-size:12px;color:var(--text2);margin-bottom:6px">Date: ${inv.date}</div>
          <span class="badge" style="background:${sc.bg};color:${sc.tx}">${cap(inv.status)}</span></div>
      </div>
      <div style="font-size:13px;margin-bottom:1.25rem;padding:10px;background:var(--bg2);border-radius:var(--radius)">
        <div style="font-weight:500;margin-bottom:2px">Bill to:</div><div style="color:var(--text2)">${inv.customer}</div></div>
      <table style="font-size:13px;margin-bottom:1rem">
        <thead><tr style="border-bottom:0.5px solid var(--border)">${["Product","Unit","Qty","Unit price","Total"].map(h=>`<th style="padding:6px 10px 6px 0;text-align:left;font-weight:500;font-size:12px;color:var(--text2)">${h}</th>`).join("")}</tr></thead>
        <tbody>${inv.items.map(it=>{const p=d.products.find(x=>x.id===it.pid);return`<tr style="border-bottom:0.5px solid var(--border)">
          <td style="padding:8px 10px 8px 0">${p?.name||it.pid}</td>
          <td style="padding:8px 10px 8px 0;color:var(--text2)">${p?.unit||""}</td>
          <td style="padding:8px 10px 8px 0">${it.qty}</td>
          <td style="padding:8px 10px 8px 0">${fmt(it.price)}</td>
          <td style="padding:8px 10px 8px 0;font-weight:600">${fmt(it.qty*it.price)}</td>
        </tr>`;}).join("")}</tbody>
      </table>
      <div style="border-top:0.5px solid var(--border);padding-top:12px;display:flex;justify-content:flex-end">
        <div style="min-width:220px;font-size:13px">
          <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--text2)">Subtotal</span><span>${fmt(sub)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:4px 0"><span style="color:var(--text2)">VAT (7.5%)</span><span>${fmt(vat)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:0.5px solid var(--border);font-weight:600;font-size:15px"><span>Total</span><span>${fmt(sub+vat)}</span></div>
        </div>
      </div>
      ${can("invoices","mark")&&inv.status!=="paid"?`<div class="no-print" style="margin-top:1rem;display:flex;gap:8px">
        <button data-ist="${inv.id}:paid">Mark as paid</button>
        ${inv.status!=="overdue"?`<button data-ist="${inv.id}:overdue">Mark overdue</button>`:""}
      </div>`:""}
    </div>`;
  }
  const tots={paid:0,pending:0,overdue:0};
  d.invoices.forEach(i=>{const t=i.items.reduce((s,it)=>s+it.qty*it.price,0);tots[i.status]=(tots[i.status]||0)+t;});
  return `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:1.25rem">
    ${[{l:"Paid",s:"paid"},{l:"Pending",s:"pending"},{l:"Overdue",s:"overdue"}].map(m=>{const sc=SC[m.s];return`
    <div class="metric" style="background:${sc.bg}"><div style="font-size:12px;color:${sc.tx};margin-bottom:4px">${m.l}</div>
    <div style="font-size:19px;font-weight:600;color:${sc.tx}">${fmt(tots[m.s])}</div></div>`;}).join("")}
  </div>
  <div class="card" style="padding:0;overflow:hidden">
    <table style="font-size:12px">
      <thead><tr style="background:var(--bg2)">${["Invoice","Date","Customer","Amount","Status",""].map(h=>`<th style="padding:8px 10px;text-align:left;font-weight:500;color:var(--text2);border-bottom:0.5px solid var(--border)">${h}</th>`).join("")}</tr></thead>
      <tbody>${[...d.invoices].reverse().map((inv,i)=>{const tot=inv.items.reduce((t,it)=>t+it.qty*it.price,0);const sc=SC[inv.status]||SC.pending;
      return`<tr style="border-bottom:${i<d.invoices.length-1?"0.5px solid var(--border)":"none"}">
        <td style="padding:9px 10px;font-weight:600">${inv.id}</td>
        <td style="padding:9px 10px;color:var(--text2)">${inv.date}</td>
        <td style="padding:9px 10px">${inv.customer}</td>
        <td style="padding:9px 10px;font-weight:600">${fmt(tot)}</td>
        <td style="padding:9px 10px"><span class="badge" style="background:${sc.bg};color:${sc.tx}">${cap(inv.status)}</span></td>
        <td style="padding:9px 10px"><button data-vi="${inv.id}" style="font-size:12px;padding:4px 10px">View</button></td>
      </tr>`;}).join("")}</tbody>
    </table>
  </div>`;
}

// ── USERS ──────────────────────────────────────────────────────────────────
function usersTab() {
  const d=D,f=UI.form;
  const PMETA=[
    {mod:"products",label:"Products",actions:[{k:"view",l:"View"},{k:"add",l:"Add"},{k:"edit",l:"Edit"},{k:"del",l:"Delete"}]},
    {mod:"inventory",label:"Inventory",actions:[{k:"view",l:"View"},{k:"adjust",l:"Adjust stock"}]},
    {mod:"sales",label:"Sales",actions:[{k:"view",l:"View"},{k:"record",l:"Record sales"}]},
    {mod:"invoices",label:"Invoices",actions:[{k:"view",l:"View"},{k:"create",l:"Create"},{k:"mark",l:"Update status"}]},
  ];
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
    <span style="font-size:13px;color:var(--text2)">${d.users.filter(u=>u.active).length} active · ${d.users.length} total</span>
    <button id="btn-add-user"><i class="ti ti-plus"></i> Add user</button>
  </div>
  ${f.uForm?`<div class="card" style="margin-bottom:1rem">
    <div style="font-weight:500;font-size:13px;margin-bottom:12px">New user account</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Full name</label><input id="uf-n" value="${f.uN||""}" style="width:100%" placeholder="Full name"></div>
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Username</label><input id="uf-u" value="${f.uU||""}" style="width:100%" placeholder="e.g. john.smith"></div>
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Password</label><input id="uf-p" type="password" style="width:100%" placeholder="Set a strong password"></div>
      <div><label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Email</label><input id="uf-e" value="${f.uE||""}" style="width:100%" placeholder="email@domain.com"></div>
    </div>
    <div style="margin-bottom:10px">
      <label style="font-size:12px;color:var(--text2);display:block;margin-bottom:6px">Access preset</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${["Manager","Viewer","Custom"].map(r=>`<button data-preset="${r}" style="font-size:12px;padding:5px 12px;font-weight:${(f.uRole||"Viewer")===r?"600":"400"};border-color:${(f.uRole||"Viewer")===r?"var(--border2)":"var(--border)"}">${r}</button>`).join("")}</div>
    </div>
    <div style="background:var(--bg2);border-radius:var(--radius);padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:500;margin-bottom:10px;color:var(--text2)">Permission matrix — tick to grant access</div>
      ${PMETA.map(m=>`<div class="cb-row"><span class="cb-label">${m.label}</span>
        ${m.actions.map(a=>{const on=f.uPerms?.[m.mod]?.[a.k]??false;return`<label class="perm-toggle${on?" on":""}"><input type="checkbox" data-pm="${m.mod}:${a.k}" ${on?"checked":""}>${a.l}</label>`;}).join("")}
      </div>`).join("")}
    </div>
    <div style="display:flex;gap:8px">
      <button id="btn-save-user" style="font-weight:500">Create user</button>
      <button id="btn-cancel-user">Cancel</button>
    </div>
  </div>`:""}
  <div class="card" style="padding:0;margin-bottom:1rem">
    ${d.users.map((u,i)=>{
      const isAdm=u.role==="Admin";
      const rC={Admin:{bg:"var(--purple-light)",tx:"var(--purple-dark)"},Manager:{bg:"var(--amber-light)",tx:"#633806"},Viewer:{bg:"var(--bg2)",tx:"var(--text2)"},Custom:{bg:"var(--teal-light)",tx:"var(--teal-dark)"}}[u.role]||{bg:"var(--bg2)",tx:"var(--text2)"};
      const initials=u.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
      const isExp=f.expUser===u.id;
      return`<div style="border-bottom:${i<d.users.length-1?"0.5px solid var(--border)":"none"}">
        <div style="display:flex;align-items:center;gap:12px;padding:11px 16px;opacity:${u.active?1:0.5}">
          <div style="width:34px;height:34px;border-radius:50%;background:#E6F1FB;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#185FA5;flex-shrink:0">${initials}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:500;font-size:13px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              ${u.name}${isAdm?`<span class="badge" style="background:var(--green-light);color:var(--green-dark);font-size:10px">System Admin</span>`:""}
              ${!u.active?`<span class="badge" style="background:var(--bg2);color:var(--text3);font-size:10px">Inactive</span>`:""}
            </div>
            <div style="font-size:12px;color:var(--text2)">${u.username} · ${u.email||"no email"}</div>
          </div>
          <span class="badge" style="background:${rC.bg};color:${rC.tx}">${u.role}</span>
          ${!isAdm?`<button data-exp="${u.id}" style="font-size:12px;padding:4px 9px"><i class="ti ti-${isExp?"chevron-up":"settings"}"></i> ${isExp?"Close":"Permissions"}</button>`:""}
          ${!isAdm?`<button data-tog="${u.id}" style="font-size:12px;padding:4px 9px">${u.active?"Deactivate":"Activate"}</button>`:""}
        </div>
        ${isExp&&!isAdm?`<div style="padding:0 16px 14px">
          <div style="background:var(--bg2);border-radius:var(--radius);padding:12px">
            <div style="font-size:12px;font-weight:500;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
              <span style="color:var(--text2)">Permissions for ${u.name}</span>
              <div style="display:flex;gap:6px"><button data-pall="${u.id}" style="font-size:11px;padding:3px 9px">Grant all</button><button data-pnone="${u.id}" style="font-size:11px;padding:3px 9px">Revoke all</button></div>
            </div>
            ${PMETA.map(m=>`<div class="cb-row"><span class="cb-label">${m.label}</span>
              ${m.actions.map(a=>{const on=u.perms?.[m.mod]?.[a.k]??false;return`<label class="perm-toggle${on?" on":""}"><input type="checkbox" data-up="${u.id}:${m.mod}:${a.k}" ${on?"checked":""}>${a.l}</label>`;}).join("")}
            </div>`).join("")}
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <label style="font-size:12px;color:var(--text2)">Reset password:</label>
            <input id="pw-${u.id}" type="password" placeholder="New password" style="width:140px">
            <button data-pw="${u.id}" style="font-size:12px;padding:4px 10px">Update</button>
          </div>
        </div>`:""}
      </div>`;
    }).join("")}
  </div>
  <div style="background:var(--bg2);border-radius:var(--radius);padding:1rem;font-size:12px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><i class="ti ti-shield-lock" style="color:var(--green)"></i><span style="font-weight:500">Security notes</span></div>
    <ul style="color:var(--text2);padding-left:1rem;line-height:1.8">
      <li>Victor (Admin) has permanent, unrestricted access to all modules.</li>
      <li>All other users require explicit permission grants from Victor.</li>
      <li>Deactivated users cannot sign in until reactivated by Victor.</li>
      <li>For maximum security, host this file on HTTPS — never plain HTTP.</li>
      <li>Change your admin password regularly from the permissions panel above.</li>
    </ul>
  </div>`;
}

// ── EVENTS ─────────────────────────────────────────────────────────────────
function bindApp() {
  document.querySelectorAll("[data-tab]").forEach(el => el.addEventListener("click", () => { UI.tab=el.dataset.tab; UI.form={}; render(); }));
  document.getElementById("btn-logout")?.addEventListener("click", () => { S=null; UI={tab:"dashboard",form:{},notice:null,loginErr:null,attempts:0,locked:false}; render(); });
  document.getElementById("btn-dismiss")?.addEventListener("click", () => { UI.notice=null; render(); });

  // PRODUCTS
  document.getElementById("btn-add-prod")?.addEventListener("click", () => { UI.form={pForm:true,pC:"Poultry"}; render(); });
  document.getElementById("btn-cancel-prod")?.addEventListener("click", () => { UI.form={}; render(); });
  document.getElementById("btn-save-prod")?.addEventListener("click", () => {
    const n=document.getElementById("pf-n")?.value,c=document.getElementById("pf-c")?.value;
    const u=document.getElementById("pf-u")?.value,p=parseFloat(document.getElementById("pf-p")?.value);
    const co=parseFloat(document.getElementById("pf-co")?.value),t=parseInt(document.getElementById("pf-t")?.value)||10;
    if(!n||isNaN(p)||isNaN(co))return;
    const d={...D,products:[...D.products]};
    if(UI.form.editId){
      const ex=d.products.find(x=>x.id===UI.form.editId);const pc=ex&&p!==ex.price;
      d.products=d.products.map(x=>x.id===UI.form.editId?{...x,name:n,cat:c,unit:u,price:p,cost:co,thresh:t}:x);
      if(pc)UI.notice={name:n,old:ex.price,nw:p};
    } else { const id="p"+uid();d.products=[...d.products,{id,name:n,cat:c,unit:u,price:p,cost:co,thresh:t}];d.stock={...d.stock,[id]:0}; }
    UI.form={};saveData(d);
  });
  document.querySelectorAll("[data-edit-p]").forEach(el => el.addEventListener("click", () => {
    const p=D.products.find(x=>x.id===el.dataset.editP);if(!p)return;
    UI.form={pForm:true,editId:p.id,pN:p.name,pC:p.cat,pU:p.unit,pP:p.price,pCo:p.cost,pT:p.thresh};render();
  }));
  document.querySelectorAll("[data-del-p]").forEach(el => el.addEventListener("click", () => {
    if(!confirm("Delete this product?"))return;
    const id=el.dataset.delP,d={...D};d.products=d.products.filter(p=>p.id!==id);const s={...d.stock};delete s[id];d.stock=s;saveData(d);
  }));

  // INVENTORY
  document.querySelectorAll("[data-adj]").forEach(el => el.addEventListener("click", () => {
    UI.form=UI.form.adjId===el.dataset.adj?{}:{adjId:el.dataset.adj,adjT:"add",adjQ:""};render();
  }));
  document.getElementById("adj-t")?.addEventListener("change", e => { UI.form.adjT=e.target.value; });
  document.getElementById("adj-q")?.addEventListener("input", e => { UI.form.adjQ=e.target.value; });
  document.getElementById("btn-adj-ok")?.addEventListener("click", () => {
    const q=Number(UI.form.adjQ);if(isNaN(q)||q<0)return;
    const d={...D,stock:{...D.stock}},cur=d.stock[UI.form.adjId]||0;
    if(UI.form.adjT==="add")d.stock[UI.form.adjId]=cur+q;
    else if(UI.form.adjT==="remove")d.stock[UI.form.adjId]=Math.max(0,cur-q);
    else d.stock[UI.form.adjId]=q;
    UI.form={};saveData(d);
  });
  document.getElementById("btn-adj-x")?.addEventListener("click", () => { UI.form={}; render(); });

  // SALES
  document.querySelectorAll("[data-sf]").forEach(el => el.addEventListener("click", () => { UI.form={sFilter:el.dataset.sf}; render(); }));
  document.getElementById("btn-sale-f")?.addEventListener("click", () => { UI.form={...UI.form,sForm:true,sPid:D.products[0]?.id,sDate:toDay()}; render(); });
  document.getElementById("btn-sale-x")?.addEventListener("click", () => { UI.form={sFilter:UI.form.sFilter}; render(); });
  document.getElementById("s-pid")?.addEventListener("change", e => { UI.form.sPid=e.target.value; render(); });
  document.getElementById("s-qty")?.addEventListener("input", e => { UI.form.sQty=e.target.value; render(); });
  document.getElementById("s-cust")?.addEventListener("input", e => { UI.form.sCust=e.target.value; });
  document.getElementById("s-date")?.addEventListener("change", e => { UI.form.sDate=e.target.value; });
  document.getElementById("btn-rec-sale")?.addEventListener("click", () => {
    const pid=UI.form.sPid,qty=Number(UI.form.sQty),cust=UI.form.sCust,date=UI.form.sDate||toDay();
    const prod=D.products.find(p=>p.id===pid);
    if(!pid||!qty||!cust||!prod)return;
    const stock=D.stock[pid]||0;if(qty>stock){alert("Insufficient stock.");return;}
    const d={...D},invId="INV-"+String(d.invoices.length+1).padStart(3,"0");
    d.sales=[...d.sales,{id:"s"+uid(),date,pid,qty,price:prod.price,customer:cust}];
    d.stock={...d.stock,[pid]:stock-qty};
    d.invoices=[...d.invoices,{id:invId,date,customer:cust,items:[{pid,qty,price:prod.price}],status:"pending"}];
    UI.form={};saveData(d);
  });

  // INVOICES
  document.querySelectorAll("[data-vi]").forEach(el => el.addEventListener("click", () => { UI.form={viewInv:el.dataset.vi}; render(); }));
  document.getElementById("btn-inv-back")?.addEventListener("click", () => { UI.form={}; render(); });
  document.querySelectorAll("[data-ist]").forEach(el => el.addEventListener("click", () => {
    const[id,st]=el.dataset.ist.split(":");
    const d={...D,invoices:D.invoices.map(i=>i.id===id?{...i,status:st}:i)};
    UI.form={viewInv:id};saveData(d);
  }));

  // USERS
  document.getElementById("btn-add-user")?.addEventListener("click", () => {
    UI.form={uForm:true,uRole:"Viewer",uPerms:JSON.parse(JSON.stringify(PBLANK))};render();
  });
  document.getElementById("btn-cancel-user")?.addEventListener("click", () => { UI.form={}; render(); });
  document.querySelectorAll("[data-preset]").forEach(el => el.addEventListener("click", () => {
    const r=el.dataset.preset;UI.form.uRole=r;
    if(r==="Manager")UI.form.uPerms=JSON.parse(JSON.stringify(PALL));
    else if(r==="Viewer")UI.form.uPerms=JSON.parse(JSON.stringify(PVIEW));
    else UI.form.uPerms=UI.form.uPerms||JSON.parse(JSON.stringify(PBLANK));
    render();
  }));
  document.querySelectorAll("[data-pm]").forEach(el => el.addEventListener("change", () => {
    const[m,a]=el.dataset.pm.split(":");
    if(!UI.form.uPerms)UI.form.uPerms=JSON.parse(JSON.stringify(PBLANK));
    UI.form.uPerms[m][a]=el.checked;UI.form.uRole="Custom";render();
  }));
  document.getElementById("btn-save-user")?.addEventListener("click", () => {
    const n=document.getElementById("uf-n")?.value,u=document.getElementById("uf-u")?.value;
    const p=document.getElementById("uf-p")?.value,e=document.getElementById("uf-e")?.value;
    if(!n||!u||!p){alert("Name, username and password are required.");return;}
    if(D.users.find(x=>x.username.toLowerCase()===u.toLowerCase())){alert("Username already exists.");return;}
    const d={...D,users:[...D.users,{id:"u"+uid(),name:n,username:u,password:p,email:e,role:UI.form.uRole||"Custom",active:true,perms:JSON.parse(JSON.stringify(UI.form.uPerms||PBLANK))}]};
    UI.form={};saveData(d);
  });
  document.querySelectorAll("[data-exp]").forEach(el => el.addEventListener("click", () => {
    UI.form={expUser:UI.form.expUser===el.dataset.exp?null:el.dataset.exp};render();
  }));
  document.querySelectorAll("[data-tog]").forEach(el => el.addEventListener("click", () => {
    const d={...D,users:D.users.map(u=>u.id===el.dataset.tog?{...u,active:!u.active}:u)};saveData(d);
  }));
  document.querySelectorAll("[data-up]").forEach(el => el.addEventListener("change", () => {
    const[uid,m,a]=el.dataset.up.split(":");
    const d={...D,users:D.users.map(u=>{if(u.id!==uid)return u;const np=JSON.parse(JSON.stringify(u.perms||PBLANK));np[m][a]=el.checked;
      const flat=[...Object.values(np)].flatMap(Object.values);
      const role=flat.every(v=>v)?"Manager":flat.every(v=>!v)?"Viewer":"Custom";
      return{...u,perms:np,role};})};
    saveData(d);
  }));
  document.querySelectorAll("[data-pall]").forEach(el => el.addEventListener("click", () => {
    const d={...D,users:D.users.map(u=>u.id===el.dataset.pall?{...u,perms:JSON.parse(JSON.stringify(PALL)),role:"Manager"}:u)};saveData(d);
  }));
  document.querySelectorAll("[data-pnone]").forEach(el => el.addEventListener("click", () => {
    const d={...D,users:D.users.map(u=>u.id===el.dataset.pnone?{...u,perms:JSON.parse(JSON.stringify(PBLANK)),role:"Viewer"}:u)};saveData(d);
  }));
  document.querySelectorAll("[data-pw]").forEach(el => el.addEventListener("click", () => {
    const id=el.dataset.pw,np=document.getElementById(`pw-${id}`)?.value;
    if(!np||np.length<6){alert("Password must be at least 6 characters.");return;}
    const d={...D,users:D.users.map(u=>u.id===id?{...u,password:np}:u)};
    saveData(d);document.getElementById(`pw-${id}`).value="";
    alert("Password updated successfully.");
  }));
}

// ── BOOT ───────────────────────────────────────────────────────────────────
loadData();
render();
