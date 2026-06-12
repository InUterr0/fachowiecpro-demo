// ===================== WARSTWA DANYCH (localStorage) =====================
const DB_KEY = 'fachowiecpro_db_v3';
localStorage.removeItem('fachowiecpro_db_v1'); // porządek po starych wersjach bazy
localStorage.removeItem('fachowiecpro_db_v2');

function loadDB(){
  const raw = localStorage.getItem(DB_KEY);
  if(raw){ try{ return JSON.parse(raw); }catch(e){} }
  const db = {
    companies: SEED_COMPANIES,
    clients: SEED_CLIENTS,
    jobs: SEED_JOBS,
    reviews: SEED_REVIEWS,
    session: null, // {type:'client'|'company', id}
  };
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}
let DB = loadDB();
function save(){ localStorage.setItem(DB_KEY, JSON.stringify(DB)); }

const $ = sel => document.querySelector(sel);
const cat = id => CATEGORIES.find(c=>c.id===id);
const company = id => DB.companies.find(c=>c.id===id);
const client = id => DB.clients.find(c=>c.id===id);
const plan = id => PLANS.find(p=>p.id===id);
const esc = s => String(s??'').replace(/[&<>"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

function me(){
  if(!DB.session) return null;
  const u = DB.session.type==='company' ? company(DB.session.id) : client(DB.session.id);
  return u ? {...u, type:DB.session.type} : null;
}

// ===================== SYSTEM RENOMY I PUNKTACJI =====================
// Punkty: każda recenzja = gwiazdki × 10, ukończone zlecenie = +25,
// polecenie klienta = +5, zweryfikowana firma = +50 (jednorazowo).
function companyReviews(cid){ return DB.reviews.filter(r=>r.companyId===cid); }
function completedJobs(cid){ return DB.jobs.filter(j=>j.acceptedCompany===cid && j.status==='completed').length; }

function repScore(cid){
  const c = company(cid); if(!c) return 0;
  const revs = companyReviews(cid);
  let pts = revs.reduce((s,r)=> s + r.stars*10 + (r.recommend?5:0), 0);
  pts += completedJobs(cid)*25;
  if(c.verified) pts += 50;
  return pts;
}
function repLevel(pts){ return REP_LEVELS.find(l=>pts>=l.min).name; }
function avgStars(cid){
  const revs = companyReviews(cid);
  if(!revs.length) return 0;
  return revs.reduce((s,r)=>s+r.stars,0)/revs.length;
}
function avgCrit(cid, key){
  const revs = companyReviews(cid).filter(r=>r.crit && r.crit[key]);
  if(!revs.length) return 0;
  return revs.reduce((s,r)=>s+r.crit[key],0)/revs.length;
}
function recommendPct(cid){
  const revs = companyReviews(cid);
  if(!revs.length) return 0;
  return Math.round(100*revs.filter(r=>r.recommend).length/revs.length);
}

function starsHTML(val, max=5){
  let h='';
  for(let i=1;i<=max;i++) h += `<span class="${i<=Math.round(val)?'':'off'}">★</span>`;
  return `<span class="stars">${h}</span>`;
}
function repBadge(cid){
  const pts = repScore(cid), lvl = repLevel(pts);
  return `<span class="rep-badge rep-${lvl}" title="${pts} pkt renomy">🏅 ${lvl} · ${pts} pkt</span>`;
}

// ===================== POMOCNICZE =====================
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), 2600);
}
function statusBadge(j){
  if(j.status==='open') return `<span class="badge badge-open">Otwarte</span>`;
  if(j.status==='in_progress') return `<span class="badge badge-progress">W realizacji</span>`;
  return `<span class="badge badge-done">Zakończone</span>`;
}
function offersLeft(c){
  const p = plan(c.plan);
  if(p.offers===Infinity) return Infinity;
  return Math.max(0, p.offers - (c.offersUsed||0));
}
function uid(prefix){ return prefix + Math.random().toString(36).slice(2,9); }
function today(){ return new Date().toISOString().slice(0,10); }

// ===================== KOMPONENTY =====================
function jobCard(j){
  const c = cat(j.cat);
  return `<div class="card job-card">
    <div>
      <span class="badge badge-cat">${c.icon} ${esc(c.name)}</span>
      ${statusBadge(j)}
      ${j.urgent?'<span class="badge badge-urgent">PILNE</span>':''}
    </div>
    <h3><a href="#/zlecenie/${j.id}">${esc(j.title)}</a></h3>
    <div class="job-meta"><span>📍 ${esc(j.city)}</span><span>📅 ${j.created}</span>${j.deadline?`<span>🗓️ termin: ${j.deadline}</span>`:''}<span>✉️ ofert: ${j.offers.length}</span></div>
    <p class="muted">${esc(j.desc).slice(0,140)}…</p>
    <div class="job-foot">
      <span class="job-budget">${esc(j.budget)}</span>
      <a class="btn btn-outline btn-sm" href="#/zlecenie/${j.id}">Szczegóły</a>
    </div>
  </div>`;
}

function companyCard(c){
  const avg = avgStars(c.id), n = companyReviews(c.id).length;
  return `<div class="card company-card">
    <div class="company-head">
      <div class="avatar">${esc(c.name[0])}</div>
      <div>
        <h3><a href="#/firma/${c.id}">${esc(c.name)}</a></h3>
        <div class="muted">📍 ${esc(c.city)} ${c.verified?'<span class="verified">✔ Zweryfikowana</span>':''}</div>
      </div>
    </div>
    <div>${repBadge(c.id)}</div>
    <div>${starsHTML(avg)} <b>${avg.toFixed(1)}</b> <span class="muted">(${n} opinii)</span></div>
    <div class="company-stats">
      <span>Ukończone: <b>${completedJobs(c.id)}</b></span>
      <span>Polecenia: <b>${recommendPct(c.id)}%</b></span>
      <span>Plan: <b>${plan(c.plan).name}</b></span>
    </div>
  </div>`;
}

function reviewHTML(r){
  const critNames = {jakosc:'Jakość', terminowosc:'Terminowość', kontakt:'Kontakt', cena:'Stosunek ceny'};
  return `<div class="review">
    <div class="review-head">
      <b>${esc(r.clientName)}</b>
      <span>${starsHTML(r.stars)} <span class="muted">${r.date}</span></span>
    </div>
    <div class="crit">${Object.entries(r.crit||{}).map(([k,v])=>`<span>${critNames[k]||k}: <b>${v}/5</b></span>`).join('')}
      ${r.recommend?'<span class="verified">👍 Poleca</span>':''}</div>
    <p>${esc(r.text)}</p>
  </div>`;
}

// ===================== TOPBAR =====================
function renderTopbar(){
  const u = me();
  const el = $('#topbarActions');
  if(!u){
    el.innerHTML = `<a class="btn btn-ghost btn-sm" href="#/logowanie">Zaloguj się</a>
      <a class="btn btn-accent btn-sm" href="#/dodaj">+ Dodaj zlecenie</a>`;
  } else if(u.type==='client'){
    el.innerHTML = `<span class="userchip">👤 <b>${esc(u.name)}</b></span>
      <a class="btn btn-accent btn-sm" href="#/dodaj">+ Dodaj zlecenie</a>
      <a class="btn btn-ghost btn-sm" href="#/panel">Panel</a>
      <button class="btn btn-ghost btn-sm" onclick="logout()">Wyloguj</button>`;
  } else {
    const left = offersLeft(u);
    el.innerHTML = `<span class="userchip">🏢 <b>${esc(u.name)}</b> · oferty: ${left===Infinity?'∞':left}</span>
      <a class="btn btn-ghost btn-sm" href="#/panel">Panel firmy</a>
      <button class="btn btn-ghost btn-sm" onclick="logout()">Wyloguj</button>`;
  }
}
function logout(){ DB.session=null; save(); renderTopbar(); location.hash='#/'; toast('Wylogowano'); }

// ===================== WIDOKI =====================
const views = {};

views.home = () => {
  const openJobs = DB.jobs.filter(j=>j.status==='open');
  const topCompanies = [...DB.companies].sort((a,b)=>repScore(b.id)-repScore(a.id)).slice(0,3);
  return `
  <div class="hero">
    <h1>Znajdź sprawdzonego wykonawcę.<br>Albo zlecenia dla swojej firmy.</h1>
    <p>FachowiecPRO to giełda zleceń budowlanych, na której liczy się <b>renoma</b> — punkty, oceny i opinie z prawdziwych, ukończonych prac.</p>
    <div class="hero-actions">
      <a class="btn btn-accent" href="#/dodaj">Dodaj zlecenie — za darmo</a>
      <a class="btn btn-ghost" href="#/cennik">Jestem wykonawcą</a>
    </div>
    <div class="hero-stats">
      <div><b>${DB.jobs.length}</b><span>zleceń w serwisie</span></div>
      <div><b>${DB.companies.length}</b><span>firm wykonawczych</span></div>
      <div><b>${DB.reviews.length}</b><span>zweryfikowanych opinii</span></div>
      <div><b>${Math.round(DB.reviews.reduce((s,r)=>s+r.stars,0)/DB.reviews.length*10)/10} ★</b><span>średnia ocena prac</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-head"><h2>Kategorie prac</h2><a href="#/kategorie">Wszystkie kategorie →</a></div>
    <div class="grid grid-4">
      ${CATEGORIES.slice(0,8).map(c=>`
        <a class="card cat-card" href="#/kategoria/${c.id}">
          <div class="cat-icon">${c.icon}</div>
          <h3>${c.name}</h3>
          <div class="count">${DB.jobs.filter(j=>j.cat===c.id).length} zleceń · ${DB.companies.filter(f=>f.cats.includes(c.id)).length} firm</div>
        </a>`).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-head"><h2>Najnowsze otwarte zlecenia</h2><a href="#/zlecenia">Wszystkie zlecenia →</a></div>
    <div class="grid grid-3">${openJobs.slice(0,6).map(jobCard).join('')}</div>
  </div>

  <div class="section">
    <div class="section-head"><h2>Firmy z najwyższą renomą</h2><a href="#/ranking">Pełny ranking →</a></div>
    <div class="grid grid-3">${topCompanies.map(companyCard).join('')}</div>
  </div>

  <div class="section">
    <div class="section-head"><h2>Jak to działa?</h2></div>
    <div class="grid grid-3">
      <div class="card"><h3>1. Klient dodaje zlecenie</h3><p class="muted">Opisujesz pracę do wykonania, budżet i lokalizację. Całkowicie za darmo.</p></div>
      <div class="card"><h3>2. Firmy składają oferty</h3><p class="muted">Wykonawcy z aktywną subskrypcją wysyłają oferty z ceną i terminem. Ty porównujesz ich renomę i opinie.</p></div>
      <div class="card"><h3>3. Ocena buduje renomę</h3><p class="muted">Po zakończeniu pracy wystawiasz ocenę. Firma zdobywa punkty renomy — najlepsi pną się w rankingu.</p></div>
    </div>
  </div>`;
};

views.kategorie = () => `
  <h1 style="margin-bottom:18px">Kategorie prac</h1>
  <div class="grid grid-4">
    ${CATEGORIES.map(c=>`
      <a class="card cat-card" href="#/kategoria/${c.id}">
        <div class="cat-icon">${c.icon}</div>
        <h3>${c.name}</h3>
        <p class="muted">${c.desc}</p>
        <div class="count">${DB.jobs.filter(j=>j.cat===c.id).length} zleceń · ${DB.companies.filter(f=>f.cats.includes(c.id)).length} firm</div>
      </a>`).join('')}
  </div>`;

views.kategoria = (catId) => {
  const c = cat(catId); if(!c) return views.notfound();
  const jobs = DB.jobs.filter(j=>j.cat===catId);
  const firms = DB.companies.filter(f=>f.cats.includes(catId)).sort((a,b)=>repScore(b.id)-repScore(a.id));
  return `
    <div class="breadcrumbs"><a href="#/kategorie">Kategorie</a> › ${c.name}</div>
    <h1>${c.icon} ${c.name}</h1>
    <p class="muted" style="margin-bottom:22px">${c.desc}</p>
    <div class="section"><div class="section-head"><h2>Zlecenia (${jobs.length})</h2></div>
      ${jobs.length? `<div class="grid grid-3">${jobs.map(jobCard).join('')}</div>` : '<div class="empty">Brak zleceń w tej kategorii. <a href="#/dodaj">Dodaj pierwsze!</a></div>'}
    </div>
    <div class="section"><div class="section-head"><h2>Polecane firmy w tej kategorii</h2></div>
      ${firms.length? `<div class="grid grid-3">${firms.map(companyCard).join('')}</div>` : '<div class="empty">Brak firm w tej kategorii.</div>'}
    </div>`;
};

views.zlecenia = () => {
  const f = window._jobFilters || {cat:'', city:'', status:'open', q:''};
  let jobs = [...DB.jobs].sort((a,b)=>b.created.localeCompare(a.created));
  if(f.cat) jobs = jobs.filter(j=>j.cat===f.cat);
  if(f.status) jobs = jobs.filter(j=>j.status===f.status);
  if(f.q) jobs = jobs.filter(j=>(j.title+j.desc+j.city).toLowerCase().includes(f.q.toLowerCase()));
  return `
    <h1 style="margin-bottom:18px">Giełda zleceń</h1>
    <div class="filters">
      <input placeholder="Szukaj…" value="${esc(f.q)}" onchange="setJobFilter('q',this.value)">
      <select onchange="setJobFilter('cat',this.value)">
        <option value="">Wszystkie kategorie</option>
        ${CATEGORIES.map(c=>`<option value="${c.id}" ${f.cat===c.id?'selected':''}>${c.name}</option>`).join('')}
      </select>
      <select onchange="setJobFilter('status',this.value)">
        <option value="" ${!f.status?'selected':''}>Każdy status</option>
        <option value="open" ${f.status==='open'?'selected':''}>Otwarte</option>
        <option value="in_progress" ${f.status==='in_progress'?'selected':''}>W realizacji</option>
        <option value="completed" ${f.status==='completed'?'selected':''}>Zakończone</option>
      </select>
    </div>
    ${jobs.length? `<div class="grid grid-3">${jobs.map(jobCard).join('')}</div>` : '<div class="empty">Brak zleceń spełniających kryteria.</div>'}`;
};
function setJobFilter(k,v){ window._jobFilters = {...(window._jobFilters||{cat:'',city:'',status:'open',q:''}), [k]:v}; render(); }

views.zlecenie = (id) => {
  const j = DB.jobs.find(x=>x.id===id); if(!j) return views.notfound();
  const c = cat(j.cat); const u = me();
  const owner = u && u.type==='client' && u.id===j.clientId;
  const isCompany = u && u.type==='company';
  const myOffer = isCompany && j.offers.find(o=>o.companyId===u.id);
  const sortedOffers = [...j.offers].sort((a,b)=>{
    // wyróżnienie: plany pro/unlimited na górze, potem renoma
    const boost = o => ['pro','unlimited'].includes(company(o.companyId).plan)?100000:0;
    return (boost(b)+repScore(b.companyId)) - (boost(a)+repScore(a.companyId));
  });

  return `
  <div class="breadcrumbs"><a href="#/zlecenia">Zlecenia</a> › <a href="#/kategoria/${c.id}">${c.name}</a> › ${esc(j.title)}</div>
  <div class="detail-grid">
    <div>
      <div class="panel">
        <div style="margin-bottom:10px">
          <span class="badge badge-cat">${c.icon} ${c.name}</span> ${statusBadge(j)}
          ${j.urgent?'<span class="badge badge-urgent">PILNE</span>':''}
        </div>
        <h2>${esc(j.title)}</h2>
        <p style="margin:12px 0">${esc(j.desc)}</p>
        ${j.photos && j.photos.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">${j.photos.map((src,i)=>`<a href="${src}" target="_blank"><img src="${src}" alt="zdjęcie ${i+1}" style="width:110px;height:110px;object-fit:cover;border-radius:8px;border:1px solid #ddd"></a>`).join('')}</div>`:''}
        <div class="kv"><span>Lokalizacja</span><b>📍 ${esc(j.city)}</b></div>
        ${j.area ? `<div class="kv"><span>Powierzchnia</span><b>${esc(j.area)} m²</b></div>`:''}
        ${j.length ? `<div class="kv"><span>Długość</span><b>${esc(j.length)} mb</b></div>`:''}
        <div class="kv"><span>Budżet klienta</span><b>${esc(j.budget)}</b></div>
        ${j.deadline ? `<div class="kv"><span>Planowany termin realizacji</span><b>📅 ${esc(j.deadline)}</b></div>`:''}
        <div class="kv"><span>Dodano</span><b>${j.created}</b></div>
        <div class="kv"><span>Zleceniodawca</span><b>${esc(client(j.clientId)?.name||'Klient')}</b></div>
      </div>

      <div class="panel">
        <h2>Oferty firm (${j.offers.length})</h2>
        ${sortedOffers.length ? sortedOffers.map((o,idx)=>{
          const f = company(o.companyId);
          const featured = ['pro','unlimited'].includes(f.plan);
          const canSee = owner || (u && u.type==='company' && u.id===o.companyId);
          if(!canSee) return `<div class="offer">
            <div class="offer-head">
              <div><b>Oferta #${idx+1}</b><div class="muted" style="font-size:.8rem">szczegóły firmy widoczne tylko dla zleceniodawcy</div></div>
              <div style="text-align:right"><div class="price">${esc(o.price)}</div></div>
            </div>
          </div>`;
          return `<div class="offer ${o.accepted?'accepted':''}">
            <div class="offer-head">
              <div>
                <a href="#/firma/${f.id}"><b>${esc(f.name)}</b></a>
                ${f.verified?'<span class="verified">✔</span>':''}
                ${featured?'<span class="badge badge-cat">⭐ Wyróżniona</span>':''}
                <div>${repBadge(f.id)} ${starsHTML(avgStars(f.id))} <span class="muted">(${companyReviews(f.id).length})</span></div>
              </div>
              <div style="text-align:right">
                <div class="price">${esc(o.price)}</div>
                ${o.start?`<div class="muted" style="font-size:.8rem">start: ${esc(o.start)}</div>`:''}
                <div class="muted" style="font-size:.8rem">realizacja: ${o.days} dni</div>
              </div>
            </div>
            <div class="offer-msg">${esc(o.msg)}</div>
            ${o.accepted?'<div class="verified" style="margin-top:8px">✔ Oferta zaakceptowana przez klienta</div>':''}
            ${owner && j.status==='open' ? `<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="acceptOffer('${j.id}','${f.id}')">Wybierz tę firmę</button>`:''}
          </div>`;
        }).join('') : '<div class="empty">Brak ofert — bądź pierwszy!</div>'}
      </div>

      ${owner && j.status==='in_progress' ? `
      <div class="panel">
        <h2>Realizacja w toku</h2>
        <p class="muted">Wykonawca: <a href="#/firma/${j.acceptedCompany}"><b>${esc(company(j.acceptedCompany).name)}</b></a></p>
        <p style="margin:10px 0">Gdy praca zostanie skończona, oznacz zlecenie jako zakończone i wystaw ocenę — to buduje renomę uczciwych firm.</p>
        <button class="btn btn-primary" onclick="completeJob('${j.id}')">✔ Praca zakończona — wystaw ocenę</button>
      </div>`:''}

      ${j.acceptedCompany && (owner || (isCompany && u.id===j.acceptedCompany)) ? views._contactPanel(j, owner) + views._chatPanel(j, u) : ''}

      ${owner && j.status==='completed' && !j.reviewed ? views._reviewForm(j) : ''}
      ${j.status==='completed' && j.reviewed ? `
      <div class="panel"><h2>Ocena klienta</h2>
        ${DB.reviews.filter(r=>r.jobId===j.id).map(reviewHTML).join('') || '<p class="muted">Oceniono.</p>'}
      </div>`:''}
    </div>

    <div>
      <div class="panel">
        <h2>Złóż ofertę</h2>
        ${j.status!=='open' ? '<p class="muted">Zlecenie nie przyjmuje już ofert.</p>'
        : !u ? `<p class="muted">Tylko zalogowane firmy mogą składać oferty.</p><a class="btn btn-primary" style="width:100%;margin-top:10px" href="#/logowanie">Zaloguj się jako firma</a>`
        : u.type==='client' ? '<p class="muted">Jesteś zalogowany jako klient — oferty składają firmy.</p>'
        : myOffer ? '<p class="verified">✔ Twoja oferta została wysłana.</p>'
        : offersLeft(u)<=0 ? `<p class="muted">Wykorzystałeś limit ofert w planie <b>${plan(u.plan).name}</b>.</p><a class="btn btn-accent" style="width:100%;margin-top:10px" href="#/cennik">Zmień plan</a>`
        : `<form onsubmit="return sendOffer(event,'${j.id}')">
            <div class="field"><label>Cena (np. 12 500 zł)</label><input name="price" required></div>
            <div class="field"><label>Najszybszy termin rozpoczęcia</label><input name="start" type="date" min="${today()}" required></div>
            <div class="field"><label>Czas realizacji (dni)</label><input name="days" type="number" min="1" required></div>
            <div class="field"><label>Wiadomość do klienta</label><textarea name="msg" required placeholder="Przedstaw swoją ofertę…"></textarea></div>
            <button class="btn btn-primary" style="width:100%">Wyślij ofertę (zużywa 1 z ${offersLeft(u)===Infinity?'∞':offersLeft(u)})</button>
          </form>`}
      </div>
      <div class="panel">
        <h3 style="margin-top:0">💡 Wskazówka</h3>
        <p class="muted">Porównuj nie tylko ceny — sprawdź <b>renomę</b>, % poleceń i opinie z ukończonych prac na profilach firm.</p>
      </div>
    </div>
  </div>`;
};

views._contactPanel = (j, owner) => {
  if(owner){
    const f = company(j.acceptedCompany);
    return `<div class="panel">
      <h2>📇 Dane kontaktowe wykonawcy</h2>
      <div class="kv"><span>Firma</span><b><a href="#/firma/${f.id}">${esc(f.name)}</a> ${f.verified?'<span class="verified">✔</span>':''}</b></div>
      ${f.address?`<div class="kv"><span>Adres</span><b>${esc(f.address)}</b></div>`:''}
      <div class="kv"><span>Miejscowość</span><b>📍 ${esc(f.city)}</b></div>
      ${f.phone?`<div class="kv"><span>Telefon</span><b><a href="tel:${esc(f.phone)}">📞 ${esc(f.phone)}</a></b></div>`:''}
      <div class="kv"><span>E-mail</span><b><a href="mailto:${esc(f.email)}">✉️ ${esc(f.email)}</a></b></div>
      ${f.nip?`<div class="kv"><span>NIP</span><b>${esc(f.nip)}</b></div>`:''}
    </div>`;
  }
  const cl = client(j.clientId);
  if(!cl) return '';
  return `<div class="panel">
    <h2>📇 Dane kontaktowe zleceniodawcy</h2>
    <div class="kv"><span>Imię i nazwisko</span><b>${esc(cl.name)}</b></div>
    ${cl.city?`<div class="kv"><span>Miejscowość</span><b>📍 ${esc(cl.city)}</b></div>`:''}
    ${cl.email?`<div class="kv"><span>E-mail</span><b><a href="mailto:${esc(cl.email)}">✉️ ${esc(cl.email)}</a></b></div>`:''}
  </div>`;
};

views._chatPanel = (j, u) => {
  const msgs = j.messages || [];
  return `<div class="panel">
    <h2>💬 Komunikator</h2>
    <p class="muted" style="margin-bottom:10px">Prywatna rozmowa między zleceniodawcą a wykonawcą tego zlecenia.</p>
    <div id="chatBox" style="max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
      ${msgs.length ? msgs.map(m=>{
        const mine = m.from === u.type;
        return `<div style="align-self:${mine?'flex-end':'flex-start'};max-width:75%;padding:8px 12px;border-radius:12px;background:${mine?'#2563eb':'#eef2f7'};color:${mine?'#fff':'inherit'}">
          <div style="font-size:.72rem;opacity:.75;margin-bottom:2px">${esc(m.name)} · ${m.ts}</div>
          <div>${esc(m.text)}</div>
        </div>`;
      }).join('') : '<p class="muted">Brak wiadomości — napisz pierwszą.</p>'}
    </div>
    <form onsubmit="return sendChat(event,'${j.id}')" style="display:flex;gap:8px">
      <input name="text" required placeholder="Napisz wiadomość…" style="flex:1" autocomplete="off">
      <button class="btn btn-primary">Wyślij</button>
    </form>
  </div>`;
};

views._reviewForm = (j) => {
  const f = company(j.acceptedCompany);
  return `<div class="panel">
    <h2>Oceń wykonawcę: ${esc(f.name)}</h2>
    <p class="muted" style="margin-bottom:14px">Twoja ocena zostanie doliczona do renomy firmy (gwiazdki × 10 pkt + 5 pkt za polecenie).</p>
    <form onsubmit="return submitReview(event,'${j.id}')">
      <div class="field"><label>Ocena ogólna</label><div class="star-input" data-name="stars">${[1,2,3,4,5].map(i=>`<span data-v="${i}">★</span>`).join('')}</div></div>
      <div class="grid grid-2">
        ${['jakosc|Jakość wykonania','terminowosc|Terminowość','kontakt|Kontakt i komunikacja','cena|Stosunek jakości do ceny'].map(x=>{
          const [k,label]=x.split('|');
          return `<div class="field"><label>${label}</label><div class="star-input" data-name="${k}">${[1,2,3,4,5].map(i=>`<span data-v="${i}">★</span>`).join('')}</div></div>`;
        }).join('')}
      </div>
      <div class="field"><label>Opinia</label><textarea name="text" required placeholder="Opisz jak przebiegła współpraca…"></textarea></div>
      <div class="field"><label><input type="checkbox" name="recommend" style="width:auto" checked> Polecam tę firmę innym</label></div>
      <button class="btn btn-primary">Opublikuj ocenę</button>
    </form>
  </div>`;
};

views.firma = (id) => {
  const c = company(id); if(!c) return views.notfound();
  const revs = companyReviews(id).sort((a,b)=>b.date.localeCompare(a.date));
  const avg = avgStars(id), pts = repScore(id), lvl = repLevel(pts);
  const critNames = {jakosc:'Jakość wykonania', terminowosc:'Terminowość', kontakt:'Kontakt', cena:'Cena/jakość'};
  return `
  <div class="breadcrumbs"><a href="#/ranking">Firmy</a> › ${esc(c.name)}</div>
  <div class="detail-grid">
    <div>
      <div class="panel">
        <div class="company-head" style="margin-bottom:14px">
          <div class="avatar" style="width:64px;height:64px;font-size:1.6rem">${esc(c.name[0])}</div>
          <div>
            <h2 style="margin:0">${esc(c.name)} ${c.verified?'<span class="verified">✔ Zweryfikowana</span>':''}</h2>
            <div class="muted">📍 ${esc(c.city)} · w serwisie od ${c.joined} · plan <b>${plan(c.plan).name}</b></div>
            <div style="margin-top:6px">${repBadge(c.id)}</div>
          </div>
        </div>
        <p>${esc(c.desc)}</p>
        <h3>Specjalizacje</h3>
        <div>${c.cats.map(x=>`<a class="badge badge-cat" href="#/kategoria/${x}" style="margin-right:6px">${cat(x).icon} ${cat(x).name}</a>`).join('')}</div>
      </div>

      <div class="panel">
        <h2>Opinie klientów (${revs.length})</h2>
        ${revs.length? revs.map(reviewHTML).join('') : '<div class="empty">Brak opinii — firma jeszcze nie zakończyła zleceń w serwisie.</div>'}
      </div>
    </div>

    <div>
      <div class="panel" style="text-align:center">
        <div class="bigscore">${avg?avg.toFixed(1):'—'}</div>
        ${starsHTML(avg)}
        <div class="muted">${revs.length} opinii · ${recommendPct(id)}% poleca</div>
        <hr style="border:none;border-top:1px solid var(--border);margin:14px 0">
        ${Object.entries(critNames).map(([k,label])=>{
          const v = avgCrit(id,k);
          return `<div class="ratingbar"><span style="width:130px;text-align:left">${label}</span><div class="bar"><i style="width:${v/5*100}%"></i></div><b>${v?v.toFixed(1):'—'}</b></div>`;
        }).join('')}
      </div>
      <div class="panel">
        <h3 style="margin-top:0">Renoma: ${lvl}</h3>
        <div class="kv"><span>Punkty renomy</span><b class="rep-score">${pts} pkt</b></div>
        <div class="kv"><span>Ukończone zlecenia</span><b>${completedJobs(id)}</b></div>
        <div class="kv"><span>Polecenia klientów</span><b>${recommendPct(id)}%</b></div>
        <div class="kv"><span>Weryfikacja firmy</span><b>${c.verified?'✔ tak (+50 pkt)':'—'}</b></div>
        <p class="hint" style="margin-top:10px"><a href="#/jak-to-dziala">Jak liczymy punkty renomy? →</a></p>
      </div>
    </div>
  </div>`;
};

views.ranking = () => {
  const sorted = [...DB.companies].sort((a,b)=>repScore(b.id)-repScore(a.id));
  return `
  <h1>Ranking firm</h1>
  <p class="muted" style="margin-bottom:18px">Pozycja w rankingu wynika wyłącznie z punktów renomy — ocen klientów, poleceń i ukończonych zleceń. <a href="#/jak-to-dziala">Zasady punktacji →</a></p>
  <table class="ranktable">
    <thead><tr><th>#</th><th>Firma</th><th>Renoma</th><th>Ocena</th><th>Ukończone</th><th>Poleca</th><th></th></tr></thead>
    <tbody>
    ${sorted.map((c,i)=>`<tr>
      <td class="rank-pos ${i<3?'top':''}">${i+1}${i===0?' 🥇':i===1?' 🥈':i===2?' 🥉':''}</td>
      <td><b><a href="#/firma/${c.id}">${esc(c.name)}</a></b> ${c.verified?'<span class="verified">✔</span>':''}<br><span class="muted" style="font-size:.78rem">📍 ${esc(c.city)} · ${c.cats.map(x=>cat(x).name).join(', ')}</span></td>
      <td>${repBadge(c.id)}</td>
      <td>${starsHTML(avgStars(c.id))} ${avgStars(c.id).toFixed(1)} <span class="muted">(${companyReviews(c.id).length})</span></td>
      <td>${completedJobs(c.id)}</td>
      <td>${recommendPct(c.id)}%</td>
      <td><a class="btn btn-outline btn-sm" href="#/firma/${c.id}">Profil</a></td>
    </tr>`).join('')}
    </tbody>
  </table>`;
};

views.cennik = () => {
  const u = me();
  return `
  <h1 style="text-align:center">Plany subskrypcji dla firm</h1>
  <p class="muted" style="text-align:center;margin-bottom:30px">Płacisz za możliwość składania ofert — dodawanie zleceń przez klientów jest zawsze darmowe.</p>
  <div class="grid grid-4">
    ${PLANS.map(p=>`
      <div class="card price-card ${p.featured?'featured':''}">
        ${p.featured?'<div class="ribbon">NAJPOPULARNIEJSZY</div>':''}
        <div class="plan-name">${p.name}</div>
        <div class="plan-price">${p.price===0?'0 zł':p.price+' zł'}<small>/mies. netto</small></div>
        <div class="muted">${p.offers===Infinity?'oferty bez limitu':p.offers+' ofert miesięcznie'}</div>
        <ul>${p.features.map(f=>`<li>${f}</li>`).join('')}</ul>
        ${u && u.type==='company'
          ? (u.plan===p.id ? '<button class="btn btn-outline" disabled>Twój obecny plan</button>'
             : `<button class="btn ${p.featured?'btn-accent':'btn-primary'}" onclick="buyPlan('${p.id}')">Wybierz plan</button>`)
          : `<a class="btn ${p.featured?'btn-accent':'btn-primary'}" href="#/rejestracja">Załóż konto firmowe</a>`}
      </div>`).join('')}
  </div>
  <div class="notice" style="margin-top:26px">💳 <b>Demo:</b> płatności są symulowane — kliknięcie „Wybierz plan" od razu aktywuje subskrypcję i resetuje licznik ofert.</div>`;
};

views['jak-to-dziala'] = () => `
  <h1>System renomy i punktacji</h1>
  <div class="detail-grid" style="margin-top:18px">
    <div class="panel">
      <h2>Jak firma zdobywa punkty?</h2>
      <div class="kv"><span>Każda gwiazdka w ocenie klienta</span><b>+10 pkt</b></div>
      <div class="kv"><span>Polecenie od klienta („Polecam")</span><b>+5 pkt</b></div>
      <div class="kv"><span>Ukończone zlecenie w serwisie</span><b>+25 pkt</b></div>
      <div class="kv"><span>Weryfikacja firmy (dokumenty, NIP)</span><b>+50 pkt (jednorazowo)</b></div>
      <h2 style="margin-top:24px">Dlaczego to działa?</h2>
      <p>Oceny można wystawić wyłącznie po <b>faktycznie ukończonym zleceniu</b> zrealizowanym przez serwis. Firmy nie mogą kupić pozycji w rankingu — wyższy plan daje więcej ofert i wyróżnienie, ale ranking zależy tylko od jakości pracy.</p>
      <p style="margin-top:10px">Każda ocena obejmuje 4 kryteria: <b>jakość wykonania, terminowość, kontakt i stosunek ceny do jakości</b> — dzięki temu widzisz pełen obraz, a nie tylko jedną liczbę.</p>
    </div>
    <div class="panel">
      <h2>Poziomy renomy</h2>
      ${[['Nowa','0 – 149 pkt','start każdej firmy'],['Brązowa','150 – 499 pkt','pierwsze udane realizacje'],['Srebrna','500 – 999 pkt','stabilna, sprawdzona firma'],['Złota','1000 – 1999 pkt','czołówka w swojej branży'],['Diamentowa','2000+ pkt','elita serwisu']].map(([n,r,d])=>`
        <div style="margin-bottom:12px"><span class="rep-badge rep-${n}">🏅 ${n}</span><br><b>${r}</b> — <span class="muted">${d}</span></div>`).join('')}
    </div>
  </div>`;

views.dodaj = () => {
  const u = me();
  if(u && u.type==='company') return `<div class="empty">Konta firmowe nie dodają zleceń. <a href="#/zlecenia">Przeglądaj giełdę zleceń →</a></div>`;
  return `
  <div class="form-narrow">
    <h1 style="margin-bottom:6px">Dodaj zlecenie</h1>
    <p class="muted" style="margin-bottom:20px">Bezpłatnie. Firmy prześlą Ci oferty z ceną i terminem.</p>
    ${!u ? `<div class="notice">Nie jesteś zalogowany — zlecenie zostanie dodane na <b>konto demo klienta</b> (Anna Wiśniewska). Możesz też się <a href="#/logowanie">zalogować</a>.</div>`:''}
    <div class="panel"><form onsubmit="return addJob(event)">
      <div class="field"><label>Tytuł zlecenia</label><input name="title" required placeholder="np. Remont łazienki 5 m²"></div>
      <div class="field"><label>Kategoria</label><select name="cat" required>${CATEGORIES.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}</select></div>
      <div class="field"><label>Opis prac</label><textarea name="desc" required placeholder="Opisz zakres prac, stan obecny, kto kupuje materiały…"></textarea></div>
      <div class="grid grid-2">
        <div class="field"><label>Powierzchnia (m²) <span class="muted">— opcjonalnie</span></label><input name="area" type="number" min="0" step="0.1" placeholder="np. 25"></div>
        <div class="field"><label>Długość (mb) <span class="muted">— opcjonalnie</span></label><input name="length" type="number" min="0" step="0.1" placeholder="np. 12"></div>
      </div>
      <div class="field"><label>Zdjęcia <span class="muted">— opcjonalnie, max 5</span></label>
        <input type="file" accept="image/*" multiple onchange="handleJobPhotos(this)">
        <div id="photoPreview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div>
      </div>
      <div class="field"><label>Miejscowość</label><input name="city" required placeholder="np. Warszawa"></div>
      <div class="field"><label>Budżet orientacyjny <span class="muted">— opcjonalnie</span></label><input name="budget" placeholder="np. 10 000 – 15 000 zł"></div>
      <div class="field"><label>Planowany termin realizacji</label><input name="deadline" type="date" min="${today()}"></div>
      <div class="field"><label><input type="checkbox" name="urgent" style="width:auto"> Zlecenie pilne</label></div>
      <button class="btn btn-primary" style="width:100%">Opublikuj zlecenie</button>
    </form></div>
  </div>`;
};

views.logowanie = () => `
  <div class="form-narrow">
    <h1 style="margin-bottom:20px">Logowanie</h1>
    <div class="notice"><b>Konta demo</b> (hasło: <code>demo</code>):<br>
      👤 klient: <code>anna@example.com</code><br>
      🏢 firma (plan Bez limitu): <code>biuro@budmax.pl</code><br>
      🏢 firma (plan Start, mały limit): <code>jan@malarz.pl</code></div>
    <div class="panel"><form onsubmit="return doLogin(event)">
      <div class="field"><label>E-mail</label><input name="email" type="email" required></div>
      <div class="field"><label>Hasło</label><input name="password" type="password" required></div>
      <button class="btn btn-primary" style="width:100%">Zaloguj się</button>
    </form>
    <p class="hint" style="margin-top:12px;text-align:center">Nie masz konta? <a href="#/rejestracja">Zarejestruj się</a></p></div>
  </div>`;

views.rejestracja = () => `
  <div class="form-narrow">
    <h1 style="margin-bottom:20px">Rejestracja</h1>
    <div class="panel"><form onsubmit="return doRegister(event)">
      <div class="field"><label>Typ konta</label>
        <select name="type" onchange="document.getElementById('firmFields').style.display=this.value==='company'?'block':'none'">
          <option value="client">👤 Klient — chcę zlecać prace</option>
          <option value="company">🏢 Firma / wykonawca — chcę zdobywać zlecenia</option>
        </select></div>
      <div class="field"><label>Nazwa firmy / imię i nazwisko</label><input name="name" required></div>
      <div class="field"><label>E-mail</label><input name="email" type="email" required></div>
      <div class="field"><label>Hasło</label><input name="password" type="password" required></div>
      <div class="field"><label>Miejscowość</label><input name="city" required></div>
      <div id="firmFields" style="display:none">
        <div class="field"><label>Adres firmy</label><input name="address" placeholder="ul. Przykładowa 1, 00-001 Warszawa"></div>
        <div class="field"><label>NIP</label><input name="nip" inputmode="numeric" maxlength="10" placeholder="np. 5260250274"></div>
        <div class="field"><label>Numer kontaktowy</label><input name="phone" type="tel" placeholder="np. 600 100 200"></div>
        <div class="field"><label>Opis firmy</label><textarea name="desc" placeholder="Czym się zajmujecie, doświadczenie, region działania…"></textarea></div>
        <div class="field"><label>Specjalizacje (przytrzymaj Ctrl, by wybrać kilka)</label>
          <select name="cats" multiple size="6">${CATEGORIES.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}</select></div>
        <p class="hint">Nowa firma startuje na darmowym planie <b>Start</b> (3 oferty/mies.) i poziomie renomy <b>Nowa</b>.</p>
      </div>
      <button class="btn btn-primary" style="width:100%">Załóż konto</button>
    </form></div>
  </div>`;

views.panel = () => {
  const u = me();
  if(!u) { location.hash='#/logowanie'; return ''; }
  return u.type==='company' ? views._panelCompany(u) : views._panelClient(u);
};

views._panelClient = (u) => {
  const myJobs = DB.jobs.filter(j=>j.clientId===u.id).sort((a,b)=>b.created.localeCompare(a.created));
  return `
  <h1>Panel klienta — ${esc(u.name)}</h1>
  <div class="statgrid" style="margin-top:18px">
    <div class="stat"><b>${myJobs.length}</b><span>moje zlecenia</span></div>
    <div class="stat"><b>${myJobs.filter(j=>j.status==='open').length}</b><span>otwarte</span></div>
    <div class="stat"><b>${myJobs.reduce((s,j)=>s+j.offers.length,0)}</b><span>otrzymane oferty</span></div>
    <div class="stat"><b>${DB.reviews.filter(r=>r.clientId===u.id).length}</b><span>wystawione oceny</span></div>
  </div>
  <div class="section-head"><h2>Moje zlecenia</h2><a class="btn btn-accent btn-sm" href="#/dodaj">+ Nowe zlecenie</a></div>
  ${myJobs.length? `<div class="grid grid-3">${myJobs.map(jobCard).join('')}</div>` : '<div class="empty">Nie masz jeszcze zleceń.</div>'}`;
};

views._panelCompany = (u) => {
  const p = plan(u.plan);
  const left = offersLeft(u);
  const myOffers = DB.jobs.flatMap(j=>j.offers.filter(o=>o.companyId===u.id).map(o=>({...o, job:j})));
  const won = myOffers.filter(o=>o.accepted).length;
  const matching = DB.jobs.filter(j=>j.status==='open' && u.cats.includes(j.cat) && !j.offers.some(o=>o.companyId===u.id));
  return `
  <h1>Panel firmy — ${esc(u.name)}</h1>
  <div style="margin:10px 0 18px">${repBadge(u.id)} ${starsHTML(avgStars(u.id))} <span class="muted">(${companyReviews(u.id).length} opinii · ${recommendPct(u.id)}% poleca)</span></div>
  <div class="statgrid">
    <div class="stat"><b>${repScore(u.id)}</b><span>punkty renomy</span></div>
    <div class="stat"><b>${myOffers.length}</b><span>wysłane oferty</span></div>
    <div class="stat"><b>${won}</b><span>wygrane zlecenia</span></div>
    <div class="stat"><b>${completedJobs(u.id)}</b><span>ukończone prace</span></div>
  </div>

  <div class="panel">
    <h2>Subskrypcja: ${p.name} <span class="muted" style="font-size:.85rem">(${p.price} zł/mies.)</span></h2>
    ${p.offers===Infinity
      ? '<p class="verified">∞ Oferty bez limitu</p>'
      : `<p>Wykorzystane oferty w tym miesiącu: <b>${u.offersUsed||0} / ${p.offers}</b> (pozostało: ${left})</p>
         <div class="quota"><i style="width:${Math.min(100,(u.offersUsed||0)/p.offers*100)}%"></i></div>`}
    <div style="margin-top:14px"><a class="btn btn-accent btn-sm" href="#/cennik">Zmień plan</a></div>
  </div>

  <div class="panel">
    <h2>Zlecenia dopasowane do Twoich specjalizacji (${matching.length})</h2>
    ${matching.length? `<div class="grid grid-3">${matching.slice(0,6).map(jobCard).join('')}</div>` : '<div class="empty">Brak nowych dopasowanych zleceń.</div>'}
  </div>

  <div class="panel">
    <h2>Twoje oferty (${myOffers.length})</h2>
    ${myOffers.length? myOffers.map(o=>`
      <div class="offer ${o.accepted?'accepted':''}">
        <div class="offer-head">
          <div><a href="#/zlecenie/${o.job.id}"><b>${esc(o.job.title)}</b></a><div class="muted" style="font-size:.8rem">${statusBadge(o.job)} 📍 ${esc(o.job.city)}</div></div>
          <div style="text-align:right"><div class="price">${esc(o.price)}</div>${o.accepted?'<span class="verified">✔ wybrana przez klienta</span>':'<span class="muted" style="font-size:.8rem">oczekuje</span>'}</div>
        </div>
      </div>`).join('') : '<div class="empty">Nie wysłałeś jeszcze żadnej oferty.</div>'}
  </div>`;
};

views.notfound = () => `<div class="empty"><h2>404</h2><p>Nie znaleziono strony.</p><a href="#/">Wróć na stronę główną</a></div>`;

// ===================== AKCJE =====================
function doLogin(e){
  e.preventDefault();
  const f = new FormData(e.target);
  const email = f.get('email').trim().toLowerCase(), pass = f.get('password');
  const c = DB.companies.find(x=>x.email===email && x.password===pass);
  const u = DB.clients.find(x=>x.email===email && x.password===pass);
  if(c){ DB.session={type:'company',id:c.id}; }
  else if(u){ DB.session={type:'client',id:u.id}; }
  else { toast('❌ Błędny e-mail lub hasło'); return false; }
  save(); renderTopbar(); location.hash='#/panel'; toast('Zalogowano ✔');
  return false;
}

function doRegister(e){
  e.preventDefault();
  const f = new FormData(e.target);
  const email = f.get('email').trim().toLowerCase();
  if(DB.companies.some(x=>x.email===email)||DB.clients.some(x=>x.email===email)){ toast('❌ Ten e-mail jest już zajęty'); return false; }
  if(f.get('type')==='company'){
    const address=(f.get('address')||'').trim(), nip=(f.get('nip')||'').trim(), phone=(f.get('phone')||'').trim();
    if(!address || !nip || !phone){ toast('❌ Uzupełnij adres, NIP i numer kontaktowy firmy'); return false; }
    if(!/^\d{10}$/.test(nip.replace(/[\s-]/g,''))){ toast('❌ NIP musi mieć 10 cyfr'); return false; }
    const id = uid('c');
    DB.companies.push({id, name:f.get('name'), city:f.get('city'), email, password:f.get('password'),
      address, nip, phone,
      cats:[...e.target.querySelector('[name=cats]').selectedOptions].map(o=>o.value),
      desc:f.get('desc')||'', plan:'start', verified:false, joined:today(), offersUsed:0});
    DB.session={type:'company',id};
  } else {
    const id = uid('u');
    DB.clients.push({id, name:f.get('name'), city:f.get('city'), email, password:f.get('password')});
    DB.session={type:'client',id};
  }
  save(); renderTopbar(); location.hash='#/panel'; toast('Konto utworzone ✔');
  return false;
}

let pendingPhotos = [];
function handleJobPhotos(input){
  pendingPhotos = [];
  const files = [...input.files].slice(0,5);
  if(input.files.length>5) toast('Maksymalnie 5 zdjęć — wzięto pierwsze 5');
  files.forEach(file=>{
    const r = new FileReader();
    r.onload = () => {
      pendingPhotos.push(r.result);
      const box = document.getElementById('photoPreview');
      if(box) box.innerHTML = pendingPhotos.map(src=>`<img src="${src}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #ddd">`).join('');
    };
    r.readAsDataURL(file);
  });
}

function addJob(e){
  e.preventDefault();
  let u = me();
  if(!u){ DB.session={type:'client',id:'u1'}; u = me(); } // demo: auto-login klienta
  const f = new FormData(e.target);
  const j = {id:uid('j'), title:f.get('title'), cat:f.get('cat'), city:f.get('city'),
    budget:(f.get('budget')||'').trim() || 'do uzgodnienia',
    area:f.get('area')||'', length:f.get('length')||'', deadline:f.get('deadline')||'',
    photos:pendingPhotos.slice(),
    desc:f.get('desc'), urgent:!!f.get('urgent'), clientId:u.id, status:'open', created:today(), offers:[]};
  pendingPhotos = [];
  DB.jobs.unshift(j); save(); renderTopbar();
  location.hash = '#/zlecenie/'+j.id; toast('Zlecenie opublikowane ✔');
  return false;
}

function sendOffer(e, jobId){
  e.preventDefault();
  const u = me(); if(!u || u.type!=='company') return false;
  if(offersLeft(u)<=0){ toast('❌ Brak dostępnych ofert w Twoim planie'); return false; }
  const f = new FormData(e.target);
  const j = DB.jobs.find(x=>x.id===jobId);
  j.offers.push({companyId:u.id, price:f.get('price'), start:f.get('start'), days:+f.get('days'), msg:f.get('msg'), date:today(), accepted:false});
  const c = company(u.id); c.offersUsed = (c.offersUsed||0)+1;
  save(); render(); renderTopbar(); toast('Oferta wysłana ✔');
  return false;
}

function sendChat(e, jobId){
  e.preventDefault();
  const u = me(); if(!u) return false;
  const j = DB.jobs.find(x=>x.id===jobId); if(!j) return false;
  const allowed = (u.type==='client' && u.id===j.clientId) || (u.type==='company' && u.id===j.acceptedCompany);
  if(!allowed) return false;
  const text = new FormData(e.target).get('text').trim();
  if(!text) return false;
  j.messages = j.messages || [];
  const now = new Date();
  j.messages.push({from:u.type, name:u.name, text, ts:today()+' '+now.toTimeString().slice(0,5)});
  save(); render();
  const box = document.getElementById('chatBox');
  if(box) box.scrollTop = box.scrollHeight;
  return false;
}

function acceptOffer(jobId, companyId){
  const j = DB.jobs.find(x=>x.id===jobId);
  j.status='in_progress'; j.acceptedCompany=companyId;
  j.offers.forEach(o=>o.accepted = o.companyId===companyId);
  save(); render(); toast('Wybrano wykonawcę: '+company(companyId).name+' ✔');
}

function completeJob(jobId){
  const j = DB.jobs.find(x=>x.id===jobId);
  j.status='completed'; save(); render(); toast('Zlecenie zakończone — wystaw ocenę ⭐');
}

function submitReview(e, jobId){
  e.preventDefault();
  const j = DB.jobs.find(x=>x.id===jobId);
  const u = me();
  const get = name => {
    const el = e.target.querySelector(`.star-input[data-name="${name}"]`);
    return +(el?.dataset.value||0);
  };
  const stars = get('stars');
  if(!stars){ toast('❌ Zaznacz ocenę ogólną (gwiazdki)'); return false; }
  const f = new FormData(e.target);
  DB.reviews.push({id:uid('r'), companyId:j.acceptedCompany, jobId:j.id, clientId:u.id, clientName:u.name,
    date:today(), stars, crit:{jakosc:get('jakosc')||stars, terminowosc:get('terminowosc')||stars, kontakt:get('kontakt')||stars, cena:get('cena')||stars},
    text:f.get('text'), recommend:!!f.get('recommend')});
  j.reviewed = true;
  save(); render(); toast('Dziękujemy! Ocena doliczona do renomy firmy ✔');
  return false;
}

function buyPlan(planId){
  const u = me(); if(!u || u.type!=='company') return;
  const c = company(u.id);
  c.plan = planId; c.offersUsed = 0;
  save(); render(); renderTopbar();
  toast('✔ Aktywowano plan '+plan(planId).name+' (płatność symulowana)');
}

// obsługa klikalnych gwiazdek w formularzach
document.addEventListener('click', e=>{
  const star = e.target.closest('.star-input span');
  if(!star) return;
  const box = star.parentElement;
  box.dataset.value = star.dataset.v;
  [...box.children].forEach(s=>s.classList.toggle('on', +s.dataset.v <= +star.dataset.v));
});

// ===================== ROUTER =====================
function render(){
  const hash = location.hash.replace(/^#\//,'') || '';
  const [route, param] = hash.split('/');
  const view = views[route||'home'] || views.notfound;
  $('#app').innerHTML = view(param);
  window.scrollTo(0,0);
}
window.addEventListener('hashchange', render);
renderTopbar();
render();
