(async function(){
  const repoBase = location.pathname.includes('/Teammate-Database/') ? '/Teammate-Database' : '';
  const dataUrl = repoBase + '/data/team.json';
  const res = await fetch(dataUrl);
  const TEAM = await res.json();

  const params = new URLSearchParams(location.search);
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));

  const roleTint = {lead:'#E3F2FF', lo:'#D7E3FF', ops:'#FFE6C8'};

  function buildCard(p){
    const url = './profile.html?slug='+encodeURIComponent(p.slug);
    const photo = BASE + encodeURIComponent(p.photoFile || 'placeholder.png');
    const nmls = p.nmls ? `<p class="role">${p.nmls}</p>` : '';
    const phone = p.phone ? `<a href="tel:${p.phone}" aria-label="Call ${p.name}">📞</a>` : '';
    const email = p.email ? `<a href="mailto:${p.email}" aria-label="Email ${p.name}">✉️</a>` : '';
    const states = (p.states||[]).slice(0,6).map(s=>`<span class="badge">${s}</span>`).join('');
    return `<a class="cardlink" href="${url}">
      <article class="card" style="--bg:${roleTint[p.role]||'#EEF2FF'}">
        <figure class="portrait"><img src="${photo}" alt="${p.name} — ${p.jobTitle||''} ${p.nmls||''}" loading="lazy" decoding="async"></figure>
        <div class="meta">
          <h3 class="name">${p.name}</h3>
          <p class="role">${p.jobTitle||''}</p>
          ${nmls}
          <div class="badges">${states}</div>
          <div class="actions">${phone}${email}</div>
        </div>
      </article>
    </a>`;
  }

  function renderList(){
    const q = ($('#q')?.value||'').toLowerCase().trim();
    const role = $('#role')?.value||'';
    const st = $('#state')?.value||'';
    const sort = $('#sort')?.value||'order';

    let items = TEAM.slice();
    if(q){
      items = items.filter(p => 
        [p.name, p.jobTitle, p.nmls].filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    if(role){
      items = items.filter(p => p.role === role);
    }
    if(st){
      items = items.filter(p => (p.states||[]).includes(st));
    }
    if(sort==='name'){
      items.sort((a,b)=>a.name.localeCompare(b.name));
    } else if(sort==='name-desc'){
      items.sort((a,b)=>b.name.localeCompare(a.name));
    } else {
      items.sort((a,b)=> (a.order||9999) - (b.order||9999));
    }

    $('#grid').innerHTML = items.map(buildCard).join('');
  }

  function populateStates(){
    const set = new Set();
    TEAM.forEach(p => (p.states||[]).forEach(s => set.add(s)));
    const sel = $('#state');
    if(!sel) return;
    Array.from(set).sort().forEach(s => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      sel.appendChild(opt);
    });
  }

  if($('#grid')){
    populateStates();
    ['q','role','state','sort'].forEach(id => $('#'+id)?.addEventListener('input', renderList));
    renderList();
  }

  if($('#profile')){
    const slug = new URLSearchParams(location.search).get('slug') || '';
    const p = TEAM.find(x => x.slug === slug);
    if(!p){
      $('#profile').innerHTML = '<p>Profile not found.</p>';
      return;
    }
    const photo = BASE + encodeURIComponent(p.photoFile||'placeholder.png');
    const states = (p.states||[]).map(s=>`<span class="badge">${s}</span>`).join('');
    const links = p.links||{};
    function link(label, url){
      return url ? `<a class="linkbtn" href="${url}" target="_blank" rel="noopener">${label}</a>` : '';
    }
    const contact = `${p.phone?`<a class="linkbtn" href="tel:${p.phone}">📞 Call</a>`:''}${p.email?`<a class="linkbtn" href="mailto:${p.email}">✉️ Email</a>`:''}`;
    $('#profile').innerHTML = `
      <div class="hero">
        <img src="${photo}" alt="${p.name}">
        <div>
          <h2>${p.name}</h2>
          <p class="role">${p.jobTitle||''} ${p.nmls?('• '+p.nmls):''}</p>
          <div class="badges">${states}</div>
          <div class="links">
            ${contact}
            ${link('Apply', links.apply)}
            ${link('Calendly', links.calendly)}
            ${link('LinkedIn', links.linkedin)}
            ${link('Reviews', links.reviews)}
            ${link('Website', links.personalSite)}
          </div>
        </div>
      </div>
    `;
  }
})();