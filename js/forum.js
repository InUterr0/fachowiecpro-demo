// ===================== FORUM SPOŁECZNOŚCI =====================
// Samodzielny moduł dla statycznych podstron /forum/*.
// Współdzieli sesję z głównym SPA (Supabase trzyma sesję w localStorage),
// więc logowanie odbywa się w aplikacji (/#/logowanie), a forum ją podchwytuje.

const FORUM_CATEGORIES = [
  {slug:'remonty-wykonczenia', icon:'🔨', name:'Remonty i wykończenia',
   desc:'Planowanie remontu, kolejność prac, materiały, wykończenia pod klucz.'},
  {slug:'lazienki-hydraulika', icon:'🚿', name:'Łazienki i hydraulika',
   desc:'Glazura, biały montaż, instalacje wod-kan, przecieki i awarie.'},
  {slug:'elektryka-instalacje', icon:'💡', name:'Elektryka i instalacje',
   desc:'Wymiana instalacji, rozdzielnice, oświetlenie, smart home, ogrzewanie.'},
  {slug:'dachy-okna-elewacje', icon:'🏠', name:'Dachy, okna i elewacje',
   desc:'Pokrycia dachowe, rynny, wymiana okien, ocieplenia i elewacje.'},
  {slug:'koszty-wyceny', icon:'💰', name:'Koszty i wyceny',
   desc:'Ile to kosztuje, jak czytać kosztorys, porównywanie ofert, dotacje.'},
  {slug:'strefa-wykonawcow', icon:'👷', name:'Strefa wykonawców',
   desc:'Rozmowy między fachowcami: wycena pracy, sprzęt, klienci, formalności.'},
];
const FORUM_CAT_BY_SLUG = Object.fromEntries(FORUM_CATEGORIES.map(c => [c.slug, c]));

const fsb = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const fesc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function ftime(ts){
  const d = new Date(ts), now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'przed chwilą';
  if (diff < 3600) return `${Math.floor(diff/60)} min temu`;
  if (diff < 86400) return `${Math.floor(diff/3600)} godz. temu`;
  if (diff < 7*86400) return `${Math.floor(diff/86400)} dni temu`;
  return d.toLocaleDateString('pl-PL', {day:'numeric', month:'short', year:'numeric'});
}

// Aktualny zalogowany użytkownik + jego nazwa wyświetlana (z clients/companies)
let _forumUser = null;
async function forumLoadUser(){
  if (!fsb) return null;
  const {data:{session}} = await fsb.auth.getSession();
  if (!session) { _forumUser = null; return null; }
  const id = session.user.id;
  let r = await fsb.from('companies').select('name').eq('id', id).maybeSingle();
  if (r.data) { _forumUser = {id, name:r.data.name, type:'company'}; return _forumUser; }
  r = await fsb.from('clients').select('name').eq('id', id).maybeSingle();
  if (r.data) { _forumUser = {id, name:r.data.name, type:'client'}; return _forumUser; }
  // zalogowany, ale bez profilu — użyj fragmentu maila
  _forumUser = {id, name:(session.user.email||'Użytkownik').split('@')[0], type:'client'};
  return _forumUser;
}

// --- DANE ---
async function forumLatest(limit=8){
  const r = await fsb.from('forum_posts').select('*').order('created',{ascending:false}).limit(limit);
  return r.data || [];
}
async function forumPostsByCat(cat){
  const r = await fsb.from('forum_posts').select('*')
    .eq('category', cat).order('pinned',{ascending:false}).order('created',{ascending:false});
  return r.data || [];
}
async function forumCountsByCat(){
  // jedno zapytanie, zliczamy po stronie klienta
  const r = await fsb.from('forum_posts').select('category');
  const counts = {};
  (r.data||[]).forEach(p => counts[p.category] = (counts[p.category]||0)+1);
  return counts;
}
async function forumComments(postId){
  const r = await fsb.from('forum_comments').select('*')
    .eq('post_id', postId).order('created',{ascending:true});
  return r.data || [];
}
async function forumCommentCounts(postIds){
  if (!postIds.length) return {};
  const r = await fsb.from('forum_comments').select('post_id').in('post_id', postIds);
  const c = {};
  (r.data||[]).forEach(x => c[x.post_id] = (c[x.post_id]||0)+1);
  return c;
}
async function forumCreatePost(cat, title, body){
  const u = _forumUser; if (!u) throw new Error('Musisz być zalogowany');
  const {data, error} = await fsb.from('forum_posts').insert({
    category:cat, author_id:u.id, author_name:u.name, author_type:u.type,
    title, body,
  }).select('*').single();
  if (error) throw error;
  return data;
}
async function forumAddComment(postId, body){
  const u = _forumUser; if (!u) throw new Error('Musisz być zalogowany');
  const {data, error} = await fsb.from('forum_comments').insert({
    post_id:postId, author_id:u.id, author_name:u.name, author_type:u.type, body,
  }).select('*').single();
  if (error) throw error;
  return data;
}
async function forumDeletePost(id){ await fsb.from('forum_posts').delete().eq('id', id); }
async function forumDeleteComment(id){ await fsb.from('forum_comments').delete().eq('id', id); }

// --- RENDER pomocnicze ---
function forumAuthorBadge(p){
  return p.author_type === 'company'
    ? '<span class="badge badge-cat" style="margin-left:6px">Wykonawca</span>' : '';
}
function forumLoginBar(){
  if (_forumUser) {
    return `<div class="forum-userbar">Piszesz jako <b>${fesc(_forumUser.name)}</b>${forumAuthorBadge(_forumUser)}</div>`;
  }
  return `<div class="forum-userbar muted">Aby założyć wątek lub odpowiedzieć,
    <a href="/#/logowanie">zaloguj się</a> lub <a href="/#/rejestracja">załóż konto</a>.</div>`;
}

// ====================== STRONA KATEGORII ======================
async function initForumCategory(){
  const root = document.getElementById('forum-app');
  if (!root) return;
  const cat = root.dataset.category;
  if (!fsb){ root.innerHTML = '<p class="muted">Forum chwilowo niedostępne.</p>'; return; }
  await forumLoadUser();
  root.innerHTML = '<p class="muted">Wczytuję wątki…</p>';
  await renderForumCategory(root, cat);
}

async function renderForumCategory(root, cat){
  const posts = await forumPostsByCat(cat);
  const counts = await forumCommentCounts(posts.map(p=>p.id));

  const newForm = _forumUser ? `
    <details class="forum-newthread">
      <summary class="btn btn-accent btn-sm">+ Nowy wątek</summary>
      <form id="forum-new-form" class="forum-form">
        <input name="title" maxlength="140" required placeholder="Tytuł wątku — konkretnie, np. „Pęka fuga w nowej łazience”">
        <textarea name="body" required rows="5" placeholder="Opisz sytuację, dodaj szczegóły, czego próbowałeś…"></textarea>
        <button class="btn btn-accent" type="submit">Opublikuj wątek</button>
      </form>
    </details>` : '';

  const list = posts.length ? posts.map(p => `
    <article class="thread" data-id="${p.id}">
      <div class="thread-head" role="button" tabindex="0">
        <div class="thread-main">
          ${p.pinned ? '<span class="badge badge-urgent" style="margin-right:6px">Przypięte</span>' : ''}
          <h3>${fesc(p.title)}</h3>
          <div class="thread-meta">${fesc(p.author_name)}${forumAuthorBadge(p)} · ${ftime(p.created)}</div>
        </div>
        <div class="thread-count">💬 ${counts[p.id]||0}</div>
      </div>
      <div class="thread-body" hidden>
        <p class="thread-text">${fesc(p.body).replace(/\n/g,'<br>')}</p>
        ${_forumUser && _forumUser.id===p.author_id ? `<button class="linklike forum-del-post" data-id="${p.id}">Usuń wątek</button>` : ''}
        <div class="thread-comments"><p class="muted">Wczytuję odpowiedzi…</p></div>
      </div>
    </article>`).join('') : '<p class="muted">Brak wątków w tej kategorii. Bądź pierwszy — załóż dyskusję!</p>';

  root.innerHTML = forumLoginBar() + newForm + `<div class="thread-list">${list}</div>`;

  const form = document.getElementById('forum-new-form');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true; btn.textContent = 'Publikuję…';
    try {
      await forumCreatePost(cat, form.title.value.trim(), form.body.value.trim());
      await renderForumCategory(root, cat);
    } catch(err){ alert('Nie udało się opublikować: ' + (err.message||err)); btn.disabled=false; btn.textContent='Opublikuj wątek'; }
  });

  root.querySelectorAll('.thread').forEach(el => {
    const head = el.querySelector('.thread-head');
    const body = el.querySelector('.thread-body');
    const toggle = async () => {
      const opening = body.hidden;
      body.hidden = !opening;
      if (opening && !el.dataset.loaded){ el.dataset.loaded='1'; await loadThreadComments(el); }
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keypress', e => { if(e.key==='Enter') toggle(); });
  });

  root.querySelectorAll('.forum-del-post').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    if (!confirm('Usunąć ten wątek wraz z odpowiedziami?')) return;
    await forumDeletePost(b.dataset.id);
    await renderForumCategory(root, cat);
  }));
}

async function loadThreadComments(threadEl){
  const id = threadEl.dataset.id;
  const wrap = threadEl.querySelector('.thread-comments');
  const comments = await forumComments(id);
  const items = comments.map(c => `
    <div class="comment" data-id="${c.id}">
      <div class="comment-meta">${fesc(c.author_name)}${forumAuthorBadge(c)} · ${ftime(c.created)}
        ${_forumUser && _forumUser.id===c.author_id ? `<button class="linklike forum-del-comment" data-id="${c.id}">usuń</button>` : ''}
      </div>
      <div class="comment-body">${fesc(c.body).replace(/\n/g,'<br>')}</div>
    </div>`).join('');
  const replyForm = _forumUser ? `
    <form class="forum-form forum-reply">
      <textarea name="body" required rows="3" placeholder="Twoja odpowiedź…"></textarea>
      <button class="btn btn-primary btn-sm" type="submit">Odpowiedz</button>
    </form>` : `<p class="muted"><a href="/#/logowanie">Zaloguj się</a>, aby odpowiedzieć.</p>`;
  wrap.innerHTML = (items || '<p class="muted">Brak odpowiedzi — odpowiedz jako pierwszy.</p>') + replyForm;

  const form = wrap.querySelector('.forum-reply');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button'); btn.disabled = true;
    try { await forumAddComment(id, form.body.value.trim()); await loadThreadComments(threadEl); }
    catch(err){ alert('Nie udało się dodać odpowiedzi: ' + (err.message||err)); btn.disabled=false; }
  });
  wrap.querySelectorAll('.forum-del-comment').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Usunąć odpowiedź?')) return;
    await forumDeleteComment(b.dataset.id); await loadThreadComments(threadEl);
  }));
}

// ====================== STRONA GŁÓWNA FORUM ======================
async function initForumHub(){
  const elCounts = document.getElementById('forum-cat-counts');
  const elLatest = document.getElementById('forum-latest');
  if (!fsb){ if(elLatest) elLatest.innerHTML='<p class="muted">Forum chwilowo niedostępne.</p>'; return; }

  if (elCounts){
    try {
      const counts = await forumCountsByCat();
      FORUM_CATEGORIES.forEach(c => {
        const node = document.querySelector(`[data-cat-count="${c.slug}"]`);
        if (node) node.textContent = `${counts[c.slug]||0} ${plForm(counts[c.slug]||0,'wątek','wątki','wątków')}`;
      });
    } catch(e){ /* zostaw wartości domyślne */ }
  }
  if (elLatest){
    try {
      const latest = await forumLatest(8);
      elLatest.innerHTML = latest.length ? latest.map(p => {
        const c = FORUM_CAT_BY_SLUG[p.category];
        return `<a class="latest-row" href="/forum/${p.category}.html">
          <span class="latest-title">${fesc(p.title)}</span>
          <span class="latest-meta">${c?c.icon+' '+fesc(c.name):''} · ${fesc(p.author_name)} · ${ftime(p.created)}</span>
        </a>`;
      }).join('') : '<p class="muted">Forum dopiero startuje — załóż pierwszy wątek w dowolnej kategorii.</p>';
    } catch(e){ elLatest.innerHTML='<p class="muted">Nie udało się wczytać najnowszych wątków.</p>'; }
  }
}
function plForm(n, one, few, many){
  if (n===1) return one;
  const m = n%10, h = n%100;
  return (m>=2 && m<=4 && !(h>=12 && h<=14)) ? few : many;
}

// auto-init wg obecnych elementów
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('forum-app')) initForumCategory();
  if (document.getElementById('forum-hub')) initForumHub();
});
