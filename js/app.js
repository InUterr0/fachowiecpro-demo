// ===================== WARSTWA DANYCH =====================
// Dane mieszkają w Supabase (js/db.js); DB to lokalny cache odświeżany po każdej mutacji.
const DB = { companies:[], clients:[], jobs:[], reviews:[], session:null };

// odśwież cache + przerysuj wszystko (wywoływane po każdej mutacji)
async function sync(){ await Data.refresh(); renderTopbar(); render(); }

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
// ===== TRYB PROMOCYJNY =====
// Na czas promocji wszystko jest darmowe: brak limitów ofert, ukryty cennik,
// brak płatności. Aby przywrócić model płatny — ustaw FREE_PROMO = false.
const FREE_PROMO = true;

// Wykonawca bez NIP = osoba prywatna (fachowiec), z NIP = firma.
function isIndividual(c){ return !c || !String(c.nip||'').trim(); }
function workerLabel(c){ return isIndividual(c) ? 'Fachowiec' : 'Firma'; }
function workerIcon(c){ return isIndividual(c) ? '👷' : '🏢'; }

function offersLeft(c){
  if(FREE_PROMO) return Infinity;
  const p = plan(c.plan);
  if(p.offers===Infinity) return Infinity;
  return Math.max(0, p.offers - (c.offersUsed||0));
}
// Szacowanie wielkości zlecenia → cena pojedynczej oferty
const OFFER_TIERS = [
  {id:'small',  label:'drobne',  price:50},
  {id:'medium', label:'średnie', price:100},
  {id:'large',  label:'duże',    price:200},
];
function jobSize(j){
  const nums = (j.budget||'').replace(/[\s ]/g,'').match(/\d+/g);
  const max = nums ? Math.max(...nums.map(Number)) : 0;
  if(max){
    if(max < 10000) return OFFER_TIERS[0];
    if(max <= 50000) return OFFER_TIERS[1];
    return OFFER_TIERS[2];
  }
  const a = parseFloat(j.area)||0;
  if(a){
    if(a < 20) return OFFER_TIERS[0];
    if(a <= 100) return OFFER_TIERS[1];
    return OFFER_TIERS[2];
  }
  return OFFER_TIERS[1]; // brak budżetu i metrażu — przyjmij średnie
}

function uid(prefix){ return prefix + Math.random().toString(36).slice(2,9); }
function today(){ return new Date().toISOString().slice(0,10); }

// ===================== KOMPONENTY =====================
function jobCard(j, withDelete=false){
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
      <span style="display:flex;gap:6px">
        <a class="btn btn-outline btn-sm" href="#/zlecenie/${j.id}">Szczegóły</a>
        ${withDelete?`<button class="btn btn-danger btn-sm" onclick="deleteJob('${j.id}')">Usuń</button>`:''}
      </span>
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
      <span>${workerIcon(c)} <b>${workerLabel(c)}</b></span>
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
    el.innerHTML = `<span class="userchip">${workerIcon(u)} <b>${esc(u.name)}</b></span>
      <a class="btn btn-ghost btn-sm" href="#/panel">Mój panel</a>
      <button class="btn btn-ghost btn-sm" onclick="logout()">Wyloguj</button>`;
  }
}
async function logout(){
  await Data.logout();
  await sync();
  location.hash='#/'; toast('Wylogowano');
}

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
      <a class="btn btn-outline" href="#/kalkulator">🧮 Policz koszt remontu</a>
      <a class="btn btn-ghost" href="#/rejestracja">Jestem wykonawcą</a>
    </div>
    <div class="promo-pill">🎉 Promocja startowa — dla wykonawców <b>wszystko za darmo</b>, bez limitów i opłat</div>
    <div class="hero-stats">
      <div><b>${DB.jobs.length}</b><span>zleceń w serwisie</span></div>
      <div><b>${DB.companies.length}</b><span>wykonawców</span></div>
      <div><b>${DB.reviews.length}</b><span>zweryfikowanych opinii</span></div>
      <div><b>${DB.reviews.length ? Math.round(DB.reviews.reduce((s,r)=>s+r.stars,0)/DB.reviews.length*10)/10+' ★' : '—'}</b><span>średnia ocena prac</span></div>
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
    <div class="section-head"><h2>Wykonawcy z najwyższą renomą</h2><a href="#/ranking">Pełny ranking →</a></div>
    <div class="grid grid-3">${topCompanies.map(companyCard).join('')}</div>
  </div>

  <div class="section">
    <div class="section-head"><h2>Jak to działa?</h2></div>
    <div class="grid grid-3">
      <div class="card"><h3>1. Klient dodaje zlecenie</h3><p class="muted">Opisujesz pracę do wykonania, budżet i lokalizację. Całkowicie za darmo.</p></div>
      <div class="card"><h3>2. Wykonawcy składają oferty</h3><p class="muted">Firmy i fachowcy wysyłają oferty z ceną i terminem. Ty porównujesz ich renomę i opinie.</p></div>
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
    <div class="section"><div class="section-head"><h2>Polecani wykonawcy w tej kategorii</h2></div>
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
    const boost = o => ['pro','unlimited'].includes(company(o.companyId)?.plan)?100000:0;
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
        ${owner?`<div style="margin-top:14px"><button class="btn btn-danger btn-sm" onclick="deleteJob('${j.id}')">🗑️ Usuń zlecenie</button></div>`:''}
      </div>

      <div class="panel">
        <h2>Oferty (${j.offers.length})</h2>
        ${sortedOffers.length ? sortedOffers.map((o,idx)=>{
          const f = company(o.companyId);
          const canSee = (owner || (u && u.type==='company' && u.id===o.companyId)) && f;
          const featured = f && ['pro','unlimited'].includes(f.plan);
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
        : !u ? `<p class="muted">Tylko zalogowani wykonawcy mogą składać oferty.</p><a class="btn btn-primary" style="width:100%;margin-top:10px" href="#/logowanie">Zaloguj się jako wykonawca</a>`
        : u.type==='client' ? '<p class="muted">Jesteś zalogowany jako klient — oferty składają wykonawcy.</p>'
        : myOffer ? '<p class="verified">✔ Twoja oferta została wysłana.</p>'
        : `
            <p class="muted" style="margin-bottom:10px">🎉 W ramach promocji składanie ofert jest <b>darmowe i bez limitów</b>.</p>
            <form onsubmit="return sendOffer(event,'${j.id}')">
            <div class="field"><label>Cena (np. 12 500 zł)</label><input name="price" required></div>
            <div class="field"><label>Najszybszy termin rozpoczęcia</label><input name="start" type="date" min="${today()}" required></div>
            <div class="field"><label>Czas realizacji (dni)</label><input name="days" type="number" min="1" required></div>
            <div class="field"><label>Wiadomość do klienta</label><textarea name="msg" required placeholder="Przedstaw swoją ofertę…"></textarea></div>
            <button class="btn btn-primary" style="width:100%">Wyślij ofertę</button>
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
      <div class="kv"><span>${workerLabel(f)}</span><b><a href="#/firma/${f.id}">${esc(f.name)}</a> ${f.verified?'<span class="verified">✔</span>':''}</b></div>
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
            <div class="muted">📍 ${esc(c.city)} · w serwisie od ${c.joined} · ${workerIcon(c)} <b>${workerLabel(c)}</b></div>
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
  <h1>Ranking wykonawców</h1>
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

views.cennik = () => `
  <div class="form-narrow" style="text-align:center">
    <div class="promo-pill" style="margin:0 auto 20px">🎉 Promocja startowa</div>
    <h1 style="margin-bottom:10px">Teraz wszystko za darmo</h1>
    <p class="muted" style="margin-bottom:26px">W ramach promocji startowej korzystanie z FachowiecPRO jest <b>całkowicie bezpłatne</b> — zarówno dla klientów, jak i dla wykonawców. Bez abonamentów, bez limitów ofert, bez opłat za leady.</p>
    <div class="panel" style="text-align:left">
      <div class="kv"><span>Dodawanie zleceń przez klientów</span><b>0 zł</b></div>
      <div class="kv"><span>Składanie ofert przez wykonawców</span><b>0 zł — bez limitu</b></div>
      <div class="kv"><span>Profil z ocenami i renomą</span><b>0 zł</b></div>
      <div class="kv"><span>Dostęp do wszystkich zleceń</span><b>0 zł</b></div>
    </div>
    <a class="btn btn-accent" style="margin-top:22px" href="#/rejestracja">Załóż darmowe konto wykonawcy</a>
    <p class="hint" style="margin-top:14px">Korzystaj póki trwa promocja — o ewentualnych zmianach poinformujemy z wyprzedzeniem.</p>
  </div>`;

// ===================== KALKULATOR WYCENY REMONTU =====================
// Stawki ROBOCIZNY (zł), orientacyjne dla rynku PL 2026. Materiały liczone osobno.
const RENO_ITEMS = [
  {id:'malowanie',  label:'Malowanie ścian i sufitów', basis:'area',    unit:'m² pow.', min:22,  max:40},
  {id:'gladzie',    label:'Gładzie gipsowe na ścianach', basis:'area',   unit:'m² pow.', min:30,  max:55},
  {id:'podlogi',    label:'Układanie podłóg (panele/winyl)', basis:'area', unit:'m²',     min:35,  max:70},
  {id:'sufity',     label:'Sufity podwieszane (karton-gips)', basis:'area', unit:'m²',    min:60,  max:120},
  {id:'elektryka',  label:'Wymiana instalacji elektrycznej', basis:'area', unit:'m²',     min:80,  max:150},
  {id:'hydraulika', label:'Wymiana instalacji hydraulicznej', basis:'area', unit:'m²',    min:60,  max:130},
  {id:'plytki',     label:'Układanie płytek / glazury', basis:'plytki',   unit:'m² płytek', min:90, max:170},
  {id:'lazienka',   label:'Remont łazienki pod klucz (robocizna)', basis:'lazienki', unit:'szt.', min:6000, max:14000},
  {id:'kuchnia',    label:'Montaż / remont kuchni (robocizna)', basis:'kuchnie', unit:'szt.', min:3000, max:9000},
  {id:'drzwi',      label:'Montaż drzwi wewnętrznych', basis:'drzwi',     unit:'szt.',   min:200, max:450},
];
const RENO_STANDARD = {ekonomiczny:0.85, standardowy:1, premium:1.4};
const RENO_REGION   = {duze:1.15, srednie:1.0, mniejsze:0.9};

function renoCalcBlock(){ return `
    <div class="detail-grid">
      <div class="panel">
        <div class="field"><label>Powierzchnia mieszkania / lokalu (m²)</label>
          <input id="renoArea" type="number" min="0" step="1" value="50" oninput="calcReno()"></div>
        <div class="grid grid-2">
          <div class="field"><label>Standard wykończenia</label>
            <select id="renoStandard" onchange="calcReno()">
              <option value="ekonomiczny">Ekonomiczny</option>
              <option value="standardowy" selected>Standardowy</option>
              <option value="premium">Premium</option>
            </select></div>
          <div class="field"><label>Region</label>
            <select id="renoRegion" onchange="calcReno()">
              <option value="duze" selected>Duże miasto (np. Trójmiasto)</option>
              <option value="srednie">Średnie miasto</option>
              <option value="mniejsze">Mniejsza miejscowość</option>
            </select></div>
        </div>
        <label style="font-weight:600;display:block;margin:6px 0 8px">Zakres prac</label>
        ${RENO_ITEMS.map(it=>`
          <div class="reno-row" style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
            <label style="flex:1;display:flex;align-items:center;gap:8px;margin:0">
              <input type="checkbox" id="chk_${it.id}" style="width:auto" onchange="calcReno()"> ${it.label}
            </label>
            ${['plytki','lazienki','kuchnie','drzwi'].includes(it.basis)
              ? `<input id="qty_${it.id}" type="number" min="0" step="1" value="${it.basis==='plytki'?'10':'1'}" oninput="calcReno()" style="width:70px" title="${it.unit}">
                 <span class="muted" style="font-size:.78rem;width:54px">${it.unit}</span>`
              : `<span class="muted" style="font-size:.78rem;width:124px;text-align:right">wg metrażu</span>`}
          </div>`).join('')}
      </div>
      <div>
        <div class="panel" id="renoResult"></div>
        <div class="panel">
          <h3 style="margin-top:0">💡 Dostań realne wyceny</h3>
          <p class="muted" style="margin-bottom:12px">Kalkulator daje orientację. Po dokładną, wiążącą wycenę opisz zlecenie — wykonawcy prześlą Ci oferty z ceną i terminem. Za darmo.</p>
          <a class="btn btn-accent" style="width:100%" href="#/dodaj">Dodaj zlecenie i odbierz oferty</a>
        </div>
      </div>
    </div>
    <div class="notice" style="margin-top:18px">ℹ️ <b><u>To wyliczenia wyłącznie orientacyjne (ogólne).</u></b> Rzeczywista cena <b>różni się w zależności od konkretnej firmy lub fachowca</b>, stanu lokalu i użytych materiałów. Kalkulator nie jest ofertą — po wiążącą wycenę dodaj zlecenie i odbierz oferty od wykonawców.</div>`;
}

views.kalkulator = () => `
  <div class="form-narrow" style="max-width:880px">
    <h1 style="margin-bottom:6px">Kalkulator wyceny remontu</h1>
    <p class="muted" style="margin-bottom:20px">Oszacuj orientacyjny koszt remontu w kilka sekund. Zaznacz zakres prac, podaj metraż i standard — wynik liczy się na bieżąco.</p>
    ${renoCalcBlock()}
  </div>`;

function calcReno(){
  const num = id => Math.max(0, parseFloat((document.getElementById(id)||{}).value)||0);
  const area = num('renoArea');
  const std = RENO_STANDARD[(document.getElementById('renoStandard')||{}).value] || 1;
  const reg = RENO_REGION[(document.getElementById('renoRegion')||{}).value] || 1;
  const basisQty = {area, plytki:num('qty_plytki'), lazienki:num('qty_lazienka'), kuchnie:num('qty_kuchnia'), drzwi:num('qty_drzwi')};
  let baseMin=0, baseMax=0; const rows=[];
  RENO_ITEMS.forEach(it=>{
    const on = (document.getElementById('chk_'+it.id)||{}).checked;
    if(!on) return;
    const qty = it.basis==='area' ? area : basisQty[it.basis] || 0;
    if(qty<=0) return;
    const mn = it.min*qty, mx = it.max*qty;
    baseMin+=mn; baseMax+=mx;
    rows.push({label:it.label, qty, unit:it.unit, mn, mx});
  });
  const out = document.getElementById('renoResult'); if(!out) return;
  if(!rows.length){ out.innerHTML = '<h2 style="margin-top:0">Szacunkowy koszt</h2><p class="muted">Zaznacz zakres prac, aby zobaczyć wycenę.</p>'; return; }
  const r = x => Math.round(x/100)*100;
  const robMin = baseMin*std*reg, robMax = baseMax*std*reg;
  const matFactor = {0.85:0.5, 1:0.7, 1.4:1.0}[std] || 0.7;
  const matMin = robMin*0.5, matMax = robMax*matFactor*1.4;
  const totMin = robMin+matMin, totMax = robMax+matMax;
  const zl = x => r(x).toLocaleString('pl-PL')+' zł';
  out.innerHTML = `
    <h2 style="margin-top:0">Szacunkowy koszt</h2>
    <table style="width:100%;border-collapse:collapse;font-size:.86rem;margin-bottom:12px">
      <thead><tr><th style="text-align:left;padding:4px 0">Pozycja</th><th style="text-align:right">Robocizna</th></tr></thead>
      <tbody>
        ${rows.map(x=>`<tr><td style="padding:4px 0;border-top:1px solid var(--border)">${x.label}<br><span class="muted" style="font-size:.76rem">${x.qty} ${x.unit}</span></td>
          <td style="text-align:right;border-top:1px solid var(--border);white-space:nowrap">${zl(x.mn*std*reg)}–${zl(x.mx*std*reg)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="kv"><span>Robocizna razem</span><b>${zl(robMin)} – ${zl(robMax)}</b></div>
    <div class="kv"><span>Materiały (szac.)</span><b>${zl(matMin)} – ${zl(matMax)}</b></div>
    <div class="kv" style="font-size:1.05rem;margin-top:6px"><span><b>Łącznie</b></span><b style="color:var(--primary)">${zl(totMin)} – ${zl(totMax)}</b></div>
    <p class="muted" style="font-size:.78rem;margin-top:10px"><u>Szacunek ogólny</u> — finalna wycena konkretnej firmy lub fachowca może się różnić.</p>
  `;
}

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
  if(u && u.type==='company') return `<div class="empty">Konta wykonawców nie dodają zleceń. <a href="#/zlecenia">Przeglądaj giełdę zleceń →</a></div>`;
  return `
  <div class="form-narrow">
    <h1 style="margin-bottom:6px">Dodaj zlecenie</h1>
    <p class="muted" style="margin-bottom:20px">Bezpłatnie. Firmy prześlą Ci oferty z ceną i terminem.</p>
    ${!u ? `<div class="notice">Aby dodać zlecenie, <a href="#/logowanie">zaloguj się</a> lub <a href="#/rejestracja">załóż darmowe konto klienta</a>.</div>`:''}
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

    <div class="section-head" style="margin-top:34px"><h2>🧮 Nie wiesz, ile to kosztuje? Policz orientacyjnie</h2></div>
    <p class="muted" style="margin-bottom:14px">Szacunek pomoże Ci ustawić budżet zlecenia. Po realne wyceny i tak najlepiej opisać zlecenie powyżej.</p>
    ${renoCalcBlock()}
  </div>`;
};

views.logowanie = () => `
  <div class="form-narrow">
    <h1 style="margin-bottom:20px">Logowanie</h1>
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
        <select name="type" onchange="updateRegFields(this.value)">
          <option value="client">👤 Klient — chcę zlecać prace</option>
          <option value="fachowiec">👷 Fachowiec — osoba prywatna szukająca zleceń</option>
          <option value="company">🏢 Firma — wykonawca z działalnością (NIP)</option>
        </select></div>
      <div class="field"><label id="nameLabel">Imię i nazwisko</label><input name="name" required></div>
      <div class="field"><label>E-mail</label><input name="email" type="email" required></div>
      <div class="field"><label>Hasło (min. 6 znaków)</label><input name="password" type="password" minlength="6" required></div>
      <div class="field"><label>Miejscowość</label><input name="city" required></div>
      <div id="workerFields" style="display:none">
        <div class="field"><label>Numer kontaktowy</label><input name="phone" type="tel" placeholder="np. 600 100 200"></div>
        <div class="field"><label id="descLabel">O mnie / opis</label><textarea name="desc" placeholder="Czym się zajmujesz, doświadczenie, region działania…"></textarea></div>
        <div class="field"><label>Specjalizacje (przytrzymaj Ctrl, by wybrać kilka)</label>
          <select name="cats" multiple size="6">${CATEGORIES.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}</select></div>
        <div id="companyOnlyFields" style="display:none">
          <div class="field"><label>Adres firmy</label><input name="address" placeholder="ul. Przykładowa 1, 00-001 Gdańsk"></div>
          <div class="field"><label>NIP</label><input name="nip" inputmode="numeric" maxlength="10" placeholder="np. 5260250274"></div>
        </div>
        <p class="hint">🎉 W ramach promocji startowej konto wykonawcy jest <b>w pełni darmowe</b> — bez limitów ofert i opłat.</p>
      </div>
      <button class="btn btn-primary" style="width:100%">Załóż konto</button>
    </form></div>
  </div>`;
function updateRegFields(type){
  const worker = type==='company' || type==='fachowiec';
  document.getElementById('workerFields').style.display = worker ? 'block' : 'none';
  document.getElementById('companyOnlyFields').style.display = type==='company' ? 'block' : 'none';
  document.getElementById('nameLabel').textContent = type==='company' ? 'Nazwa firmy' : 'Imię i nazwisko';
  document.getElementById('descLabel').textContent = type==='company' ? 'Opis firmy' : 'O mnie / opis';
}

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
  ${myJobs.length? `<div class="grid grid-3">${myJobs.map(j=>jobCard(j,true)).join('')}</div>` : '<div class="empty">Nie masz jeszcze zleceń.</div>'}

  <div class="section-head" style="margin-top:34px"><h2>🧮 Kalkulator wyceny remontu</h2></div>
  <p class="muted" style="margin-bottom:14px">Oszacuj orientacyjny koszt, zanim dodasz zlecenie.</p>
  ${renoCalcBlock()}`;
};

views._panelCompany = (u) => {
  const myOffers = DB.jobs.flatMap(j=>j.offers.filter(o=>o.companyId===u.id).map(o=>({...o, job:j})));
  const won = myOffers.filter(o=>o.accepted).length;
  const matching = DB.jobs.filter(j=>j.status==='open' && u.cats.includes(j.cat) && !j.offers.some(o=>o.companyId===u.id));
  return `
  <h1>Panel wykonawcy — ${esc(u.name)} <span class="muted" style="font-size:1rem">(${workerIcon(u)} ${workerLabel(u)})</span></h1>
  <div style="margin:10px 0 18px">${repBadge(u.id)} ${starsHTML(avgStars(u.id))} <span class="muted">(${companyReviews(u.id).length} opinii · ${recommendPct(u.id)}% poleca)</span></div>
  <div class="statgrid">
    <div class="stat"><b>${repScore(u.id)}</b><span>punkty renomy</span></div>
    <div class="stat"><b>${myOffers.length}</b><span>wysłane oferty</span></div>
    <div class="stat"><b>${won}</b><span>wygrane zlecenia</span></div>
    <div class="stat"><b>${completedJobs(u.id)}</b><span>ukończone prace</span></div>
  </div>

  <div class="panel">
    <h2>🎉 Konto w promocji startowej</h2>
    <p class="verified">Składanie ofert za darmo i bez limitów — korzystaj póki trwa promocja.</p>
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
async function doLogin(e){
  e.preventDefault();
  const f = new FormData(e.target);
  try{
    await Data.login(f.get('email').trim().toLowerCase(), f.get('password'));
  }catch(err){ toast('❌ Błędny e-mail lub hasło'); return false; }
  renderTopbar(); location.hash='#/panel'; toast('Zalogowano ✔');
  return false;
}

async function doRegister(e){
  e.preventDefault();
  const f = new FormData(e.target);
  const email = f.get('email').trim().toLowerCase();
  const type = f.get('type');
  // 'fachowiec' i 'company' zapisujemy do tabeli wykonawców (companies); różni je tylko NIP.
  const dbType = type==='client' ? 'client' : 'company';
  let row;
  if(type==='company'){
    const address=(f.get('address')||'').trim(), nip=(f.get('nip')||'').trim(), phone=(f.get('phone')||'').trim();
    if(!address || !nip || !phone){ toast('❌ Uzupełnij adres, NIP i numer kontaktowy firmy'); return false; }
    if(!/^\d{10}$/.test(nip.replace(/[\s-]/g,''))){ toast('❌ NIP musi mieć 10 cyfr'); return false; }
    row = {name:f.get('name'), city:f.get('city'), address, nip, phone,
      cats:[...e.target.querySelector('[name=cats]').selectedOptions].map(o=>o.value),
      "desc":f.get('desc')||''};
  } else if(type==='fachowiec'){
    // osoba prywatna: bez NIP i adresu firmy
    row = {name:f.get('name'), city:f.get('city'), nip:'', address:'', phone:(f.get('phone')||'').trim(),
      cats:[...e.target.querySelector('[name=cats]').selectedOptions].map(o=>o.value),
      "desc":f.get('desc')||''};
  } else {
    row = {name:f.get('name'), city:f.get('city')};
  }
  try{
    const res = await Data.register(dbType, email, f.get('password'), row);
    if(res.needsConfirm){
      toast('📧 Sprawdź skrzynkę i potwierdź e-mail, potem zaloguj się');
      location.hash='#/logowanie';
      return false;
    }
  }catch(err){ toast('❌ '+err.message); return false; }
  renderTopbar(); location.hash='#/panel'; toast('Konto utworzone ✔');
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

async function addJob(e){
  e.preventDefault();
  const u = me();
  if(!u || u.type!=='client'){ toast('❌ Zaloguj się jako klient, aby dodać zlecenie'); location.hash='#/logowanie'; return false; }
  const f = new FormData(e.target);
  const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = 'Publikowanie…';
  try{
    const photoUrls = await Data.uploadPhotos(pendingPhotos);
    const id = await Data.addJob({
      title:f.get('title'), cat:f.get('cat'), city:f.get('city'),
      budget:(f.get('budget')||'').trim(),
      area:f.get('area')||'', length:f.get('length')||'', deadline:f.get('deadline')||'',
      desc:f.get('desc'), urgent:!!f.get('urgent'),
    }, photoUrls);
    pendingPhotos = [];
    await sync();
    location.hash = '#/zlecenie/'+id; toast('Zlecenie opublikowane ✔');
  }catch(err){ toast('❌ '+err.message); btn.disabled = false; btn.textContent = 'Opublikuj zlecenie'; }
  return false;
}

async function sendOffer(e, jobId){
  e.preventDefault();
  const u = me(); if(!u || u.type!=='company') return false;
  const paid = (u.paidJobs||[]).includes(jobId);
  if(!paid && offersLeft(u)<=0){ toast('❌ Brak dostępnych ofert — kup pojedynczą ofertę lub subskrypcję'); return false; }
  const f = new FormData(e.target);
  try{
    await Data.sendOffer(jobId, {price:f.get('price'), start:f.get('start'), days:+f.get('days'), msg:f.get('msg')}, paid);
    await sync(); toast('Oferta wysłana ✔');
  }catch(err){ toast('❌ '+err.message); }
  return false;
}

async function buySingleOffer(jobId){
  const u = me(); if(!u || u.type!=='company') return;
  const j = DB.jobs.find(x=>x.id===jobId); if(!j) return;
  try{
    await Data.buySingleOffer(jobId);
    await sync();
    toast(`✔ Wykupiono ofertę za ${jobSize(j).price} zł (płatność symulowana)`);
  }catch(err){ toast('❌ '+err.message); }
}

async function sendChat(e, jobId){
  e.preventDefault();
  const u = me(); if(!u) return false;
  const j = DB.jobs.find(x=>x.id===jobId); if(!j) return false;
  const allowed = (u.type==='client' && u.id===j.clientId) || (u.type==='company' && u.id===j.acceptedCompany);
  if(!allowed) return false;
  const text = new FormData(e.target).get('text').trim();
  if(!text) return false;
  try{
    await Data.sendChat(jobId, text);
    await sync();
    const box = document.getElementById('chatBox');
    if(box) box.scrollTop = box.scrollHeight;
  }catch(err){ toast('❌ '+err.message); }
  return false;
}

async function acceptOffer(jobId, companyId){
  try{
    await Data.acceptOffer(jobId, companyId);
    await sync();
    toast('Wybrano wykonawcę: '+(company(companyId)?.name||'')+' ✔');
  }catch(err){ toast('❌ '+err.message); }
}

async function deleteJob(jobId){
  const u = me();
  const j = DB.jobs.find(x=>x.id===jobId);
  if(!u || u.type!=='client' || !j || j.clientId!==u.id){ toast('❌ Możesz usunąć tylko własne zlecenie'); return; }
  if(!confirm(`Usunąć zlecenie „${j.title}"? Tej operacji nie można cofnąć — znikną też oferty i wiadomości do tego zlecenia.`)) return;
  try{
    await Data.deleteJob(jobId);
    await sync();
    if(location.hash.startsWith('#/zlecenie/')) location.hash='#/panel';
    toast('Zlecenie usunięte ✔');
  }catch(err){ toast('❌ '+err.message); }
}

async function completeJob(jobId){
  try{
    await Data.completeJob(jobId);
    await sync(); toast('Zlecenie zakończone — wystaw ocenę ⭐');
  }catch(err){ toast('❌ '+err.message); }
}

async function submitReview(e, jobId){
  e.preventDefault();
  const j = DB.jobs.find(x=>x.id===jobId);
  const get = name => {
    const el = e.target.querySelector(`.star-input[data-name="${name}"]`);
    return +(el?.dataset.value||0);
  };
  const stars = get('stars');
  if(!stars){ toast('❌ Zaznacz ocenę ogólną (gwiazdki)'); return false; }
  const f = new FormData(e.target);
  try{
    await Data.submitReview(j, stars,
      {jakosc:get('jakosc')||stars, terminowosc:get('terminowosc')||stars, kontakt:get('kontakt')||stars, cena:get('cena')||stars},
      f.get('text'), !!f.get('recommend'));
    await sync(); toast('Dziękujemy! Ocena doliczona do renomy firmy ✔');
  }catch(err){ toast('❌ '+err.message); }
  return false;
}

async function buyPlan(planId){
  const u = me(); if(!u || u.type!=='company') return;
  try{
    await Data.buyPlan(planId);
    await sync();
    toast('✔ Aktywowano plan '+plan(planId).name+' (płatność symulowana)');
  }catch(err){ toast('❌ '+err.message); }
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
  if(document.getElementById('renoArea')) calcReno();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange', render);

async function init(){
  if(!Data.ready){
    $('#app').innerHTML = `<div class="empty"><h2>⚙️ Brak konfiguracji bazy</h2>
      <p>Uzupełnij <code>SUPABASE_URL</code> i <code>SUPABASE_ANON_KEY</code> w pliku <b>js/config.js</b>.</p></div>`;
    return;
  }
  $('#app').innerHTML = '<div class="empty"><h2>⏳ Ładowanie…</h2></div>';
  try{
    await Data.refresh();
    await Data.initSession();
  }catch(err){
    $('#app').innerHTML = `<div class="empty"><h2>❌ Błąd połączenia z bazą</h2><p>${esc(err.message)}</p>
      <p class="muted">Sprawdź, czy schemat (supabase/schema.sql) został uruchomiony w SQL Editorze.</p></div>`;
    return;
  }
  renderTopbar();
  render();
}
init();
