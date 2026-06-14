// ===================== WARSTWA DANYCH — SUPABASE =====================
// Mapuje tabele (snake_case) na obiekty używane przez widoki (camelCase)
// i utrzymuje lokalny cache DB, dzięki czemu widoki renderują synchronicznie.

const sb = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const PENDING_PROFILE_KEY = 'fp_pending_profile';

// --- mapowanie wierszy bazy -> obiekty aplikacji ---
const _client  = r => ({id:r.id, name:r.name, city:r.city, email:r.email, created:r.created});
const _company = r => ({id:r.id, name:r.name, city:r.city, email:r.email, address:r.address,
  nip:r.nip, phone:r.phone, desc:r.desc, cats:r.cats||[], plan:r.plan, verified:r.verified,
  joined:r.joined, offersUsed:r.offers_used, paidJobs:r.paid_jobs||[]});
const _job = r => ({id:r.id, clientId:r.client_id, title:r.title, cat:r.cat, city:r.city,
  budget:r.budget, area:r.area, length:r.length, deadline:r.deadline||'', photos:r.photos||[],
  desc:r.desc, urgent:r.urgent, status:r.status, acceptedCompany:r.accepted_company,
  reviewed:r.reviewed, created:r.created});
const _offer = r => ({id:r.id, jobId:r.job_id, companyId:r.company_id, price:r.price,
  start:r.start||'', days:r.days, msg:r.msg, accepted:r.accepted, date:r.date});
const _review = r => ({id:r.id, companyId:r.company_id, jobId:r.job_id, clientId:r.client_id,
  clientName:r.client_name, date:r.date, stars:r.stars, crit:r.crit||{}, text:r.text, recommend:r.recommend});
const _msg = r => ({from:r.sender_type, name:r.name, text:r.text,
  ts:(r.ts||'').slice(0,16).replace('T',' ')});

function _fail(error){
  console.error(error);
  throw new Error(error.message || 'Błąd połączenia z bazą');
}

const Data = {
  ready: !!sb,

  // Pobiera wszystko i składa cache DB w kształcie, którego oczekują widoki
  async refresh(){
    const [comp, cli, jobs, offPub, offFull, revs, msgs] = await Promise.all([
      sb.from('companies').select('*'),
      sb.from('clients').select('*'),
      sb.from('jobs').select('*').order('created', {ascending:false}),
      sb.from('offers_public').select('*'),
      sb.from('offers').select('*'),          // RLS zwróci tylko te, które wolno widzieć
      sb.from('reviews').select('*').order('date', {ascending:false}),
      sb.from('messages').select('*').order('ts'),
    ]);
    for(const r of [comp, cli, jobs, offPub, revs]) if(r.error) _fail(r.error);

    const fullById = {};
    (offFull.data||[]).forEach(o => fullById[o.id] = o);
    const offersByJob = {};
    (offPub.data||[]).forEach(o => {
      (offersByJob[o.job_id] ||= []).push(_offer(fullById[o.id] || o));
    });
    const msgsByJob = {};
    (msgs.data||[]).forEach(m => (msgsByJob[m.job_id] ||= []).push(_msg(m)));

    DB.companies = (comp.data||[]).map(_company);
    DB.clients   = (cli.data||[]).map(_client);
    DB.reviews   = (revs.data||[]).map(_review);
    DB.jobs      = (jobs.data||[]).map(j => ({
      ..._job(j),
      offers: offersByJob[j.id] || [],
      messages: msgsByJob[j.id] || [],
    }));
  },

  // --- sesja / auth ---
  async initSession(){
    const {data:{session}} = await sb.auth.getSession();
    if(!session){ DB.session = null; return; }
    const id = session.user.id;
    // profil mógł nie powstać przy rejestracji (np. wymagane potwierdzenie maila) — dokończ go
    if(!DB.companies.some(c=>c.id===id) && !DB.clients.some(c=>c.id===id)){
      const pending = localStorage.getItem(PENDING_PROFILE_KEY);
      if(pending){
        const p = JSON.parse(pending);
        const table = p.type==='company' ? 'companies' : 'clients';
        const {error} = await sb.from(table).insert({id, ...p.row, email:session.user.email});
        if(!error){ localStorage.removeItem(PENDING_PROFILE_KEY); await this.refresh(); }
      }
    }
    DB.session = DB.companies.some(c=>c.id===id) ? {type:'company', id}
               : DB.clients.some(c=>c.id===id)   ? {type:'client', id}
               : null;
  },

  async login(email, password){
    const {error} = await sb.auth.signInWithPassword({email, password});
    if(error) _fail(error);
    await this.refresh();
    await this.initSession();
  },

  async register(type, email, password, row){
    const {data, error} = await sb.auth.signUp({email, password});
    if(error) _fail(error);
    // zapamiętaj profil na wypadek, gdyby sesja powstała dopiero po potwierdzeniu maila
    localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify({type, row}));
    if(!data.session) return {needsConfirm:true};
    const table = type==='company' ? 'companies' : 'clients';
    const {error: e2} = await sb.from(table).insert({id:data.user.id, ...row, email});
    if(e2) _fail(e2);
    localStorage.removeItem(PENDING_PROFILE_KEY);
    await this.refresh();
    await this.initSession();
    return {needsConfirm:false};
  },

  async logout(){
    await sb.auth.signOut();
    DB.session = null;
  },

  // --- zdjęcia: dataURL -> Storage -> publiczny URL ---
  async uploadPhotos(dataUrls){
    const urls = [];
    for(const d of dataUrls){
      const blob = await (await fetch(d)).blob();
      const ext = (blob.type.split('/')[1]||'jpg').replace('jpeg','jpg');
      const path = `${crypto.randomUUID()}.${ext}`;
      const {error} = await sb.storage.from('job-photos').upload(path, blob);
      if(error) _fail(error);
      urls.push(sb.storage.from('job-photos').getPublicUrl(path).data.publicUrl);
    }
    return urls;
  },

  // --- mutacje ---
  async addJob(f, photoUrls){
    const {data, error} = await sb.from('jobs').insert({
      client_id: DB.session.id,
      title: f.title, cat: f.cat, city: f.city,
      budget: f.budget || 'do uzgodnienia',
      area: f.area || '', length: f.length || '',
      deadline: f.deadline || null,
      photos: photoUrls, "desc": f.desc, urgent: f.urgent,
    }).select('id').single();
    if(error) _fail(error);
    return data.id;
  },

  async sendOffer(jobId, o, paid){
    const {error} = await sb.from('offers').insert({
      job_id: jobId, company_id: DB.session.id,
      price: o.price, "start": o.start || null, days: o.days, msg: o.msg,
    });
    if(error) _fail(error);
    const c = DB.companies.find(x=>x.id===DB.session.id);
    const patch = paid
      ? {paid_jobs: c.paidJobs.filter(x=>x!==jobId)}
      : {offers_used: (c.offersUsed||0)+1};
    const {error: e2} = await sb.from('companies').update(patch).eq('id', DB.session.id);
    if(e2) _fail(e2);
  },

  async buySingleOffer(jobId){
    const c = DB.companies.find(x=>x.id===DB.session.id);
    if(c.paidJobs.includes(jobId)) return;
    const {error} = await sb.from('companies')
      .update({paid_jobs: [...c.paidJobs, jobId]}).eq('id', DB.session.id);
    if(error) _fail(error);
  },

  async acceptOffer(jobId, companyId){
    let r = await sb.from('jobs').update({status:'in_progress', accepted_company:companyId}).eq('id', jobId);
    if(r.error) _fail(r.error);
    r = await sb.from('offers').update({accepted:true}).eq('job_id', jobId).eq('company_id', companyId);
    if(r.error) _fail(r.error);
    r = await sb.from('offers').update({accepted:false}).eq('job_id', jobId).neq('company_id', companyId);
    if(r.error) _fail(r.error);
  },

  async deleteJob(jobId){
    const {error} = await sb.from('jobs').delete().eq('id', jobId);
    if(error) _fail(error);
  },

  async completeJob(jobId){
    const {error} = await sb.from('jobs').update({status:'completed'}).eq('id', jobId);
    if(error) _fail(error);
  },

  async submitReview(j, stars, crit, text, recommend){
    const u = me();
    let r = await sb.from('reviews').insert({
      company_id: j.acceptedCompany, job_id: j.id, client_id: u.id,
      client_name: u.name, stars, crit, text, recommend,
    });
    if(r.error) _fail(r.error);
    r = await sb.from('jobs').update({reviewed:true}).eq('id', j.id);
    if(r.error) _fail(r.error);
  },

  async buyPlan(planId){
    const {error} = await sb.from('companies')
      .update({plan:planId, offers_used:0}).eq('id', DB.session.id);
    if(error) _fail(error);
  },

  async sendChat(jobId, text){
    const u = me();
    const {error} = await sb.from('messages').insert({
      job_id: jobId, sender_id: u.id, sender_type: u.type, name: u.name, text,
    });
    if(error) _fail(error);
  },
};
