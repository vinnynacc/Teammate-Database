// app.js
(async function () {
  const repoBase = location.pathname.includes('/Teammate-Database/')
    ? '/Teammate-Database'
    : '';
  const API_BASE = repoBase + '/api';
  const IMAGE_BASE = repoBase + '/images/';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  const roleTint = { lead: '#E3F2FF', lo: '#D7E3FF', ops: '#FFE6C8' };
  let TEAM = [];

  function safeFile(file) {
    if (!file) return '';
    if (/^https?:/i.test(file)) return file;
    if (file.startsWith('uploads/')) {
      return repoBase + '/' + file;
    }
    try {
      const decoded = decodeURIComponent(file);
      return IMAGE_BASE + encodeURIComponent(decoded);
    } catch (err) {
      return IMAGE_BASE + encodeURIComponent(file);
    }
  }

  function photoUrl(file) {
    const result = safeFile(file);
    return result || IMAGE_BASE + 'placeholder.png';
  }

  async function loadTeam() {
    const res = await fetch(API_BASE + '/teammates');
    if (!res.ok) {
      throw new Error('Failed to load teammates');
    }
    TEAM = await res.json();
    return TEAM;
  }

  function buildCard(p) {
    const url = './profile.html?slug=' + encodeURIComponent(p.slug);
    const photo = photoUrl(p.photoFile);
    const nmls = p.nmls ? `<p class="role">${p.nmls}</p>` : '';
    const location = p.location ? `<p class="location">${p.location}</p>` : '';
    const phone = p.phone
      ? `<a href="tel:${p.phone}" aria-label="Call ${p.name}">📞</a>`
      : '';
    const email = p.email
      ? `<a href="mailto:${p.email}" aria-label="Email ${p.name}">✉️</a>`
      : '';
    const states = (p.states || [])
      .slice(0, 6)
      .map((s) => `<span class="badge">${s}</span>`)
      .join('');
    return `<a class="cardlink" href="${url}">
      <article class="card" style="--bg:${roleTint[p.role] || '#EEF2FF'}">
        <figure class="portrait"><img src="${photo}" alt="${p.name} — ${p.jobTitle || ''} ${p.nmls || ''}" loading="lazy" decoding="async"></figure>
        <div class="meta">
          <h3 class="name">${p.name}</h3>
          <p class="role">${p.jobTitle || ''}</p>
          ${location}
          ${nmls}
          <div class="badges">${states}</div>
          <div class="actions">${phone}${email}</div>
        </div>
      </article>
    </a>`;
  }

  function renderList() {
    const q = ($('#q')?.value || '').toLowerCase().trim();
    const role = $('#role')?.value || '';
    const st = $('#state')?.value || '';
    const sort = $('#sort')?.value || 'order';

    let items = TEAM.slice();
    if (q) {
      items = items.filter((p) =>
        [p.name, p.jobTitle, p.nmls, p.location]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }
    if (role) {
      items = items.filter((p) => p.role === role);
    }
    if (st) {
      items = items.filter((p) => (p.states || []).includes(st));
    }
    if (sort === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name-desc') {
      items.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      items.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    }

    const grid = $('#grid');
    if (grid) {
      grid.innerHTML = items.map(buildCard).join('');
    }
  }

  function populateStates() {
    const set = new Set();
    TEAM.forEach((p) => (p.states || []).forEach((s) => set.add(s)));
    const sel = $('#state');
    if (!sel) return;
    sel.querySelectorAll('option[data-dynamic]').forEach((opt) => opt.remove());
    Array.from(set)
      .sort()
      .forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.dataset.dynamic = 'true';
        opt.textContent = s;
        sel.appendChild(opt);
      });
  }

  function renderProfile() {
    const slug = new URLSearchParams(location.search).get('slug') || '';
    const p = TEAM.find((x) => x.slug === slug);
    const profile = $('#profile');
    if (!profile) return;
    if (!p) {
      profile.innerHTML = '<p>Profile not found.</p>';
      return;
    }
    const photo = photoUrl(p.photoFile);
    const states = (p.states || [])
      .map((s) => `<span class="badge">${s}</span>`)
      .join('');
    const links = p.links || {};
    const socials = Object.entries(p.socialHandles || {})
      .filter(([, url]) => !!url)
      .map(
        ([network, url]) =>
          `<a class="linkbtn" href="${url}" target="_blank" rel="noopener">${network}</a>`
      )
      .join('');

    function link(label, url) {
      return url
        ? `<a class="linkbtn" href="${url}" target="_blank" rel="noopener">${label}</a>`
        : '';
    }

    const contact = `${p.phone ? `<a class="linkbtn" href="tel:${p.phone}">📞 Call</a>` : ''}${
      p.email ? `<a class="linkbtn" href="mailto:${p.email}">✉️ Email</a>` : ''
    }`;

    const specialties = (p.specialties || []).join(', ');
    const certifications = (p.certifications || []).join(', ');
    const languages = (p.languages || []).join(', ');

    profile.innerHTML = `
      <div class="hero">
        <img src="${photo}" alt="${p.name}">
        <div>
          <h2>${p.name}</h2>
          <p class="role">${p.jobTitle || ''} ${p.nmls ? '• ' + p.nmls : ''}</p>
          ${p.location ? `<p class="role">📍 ${p.location}</p>` : ''}
          <div class="badges">${states}</div>
          <div class="links">
            ${contact}
            ${link('Apply', links.apply)}
            ${link('Calendly', links.calendly)}
            ${link('LinkedIn', links.linkedin)}
            ${link('Reviews', links.reviews)}
            ${link('Website', links.personalSite)}
            ${socials}
          </div>
        </div>
      </div>
      ${p.bio ? `<section><h3>About</h3><p>${p.bio}</p></section>` : ''}
      ${specialties ? `<section><h3>Specialties</h3><p>${specialties}</p></section>` : ''}
      ${certifications ? `<section><h3>Certifications</h3><p>${certifications}</p></section>` : ''}
      ${languages ? `<section><h3>Languages</h3><p>${languages}</p></section>` : ''}
      ${p.funFact ? `<section><h3>Fun Fact</h3><p>${p.funFact}</p></section>` : ''}
    `;
  }

  async function bootstrapPublicPages() {
    const grid = $('#grid');
    const profile = $('#profile');
    if (!grid && !profile) return;
    try {
      await loadTeam();
      populateStates();
      renderList();
      renderProfile();
      ['q', 'role', 'state', 'sort'].forEach((id) =>
        $('#' + id)?.addEventListener('input', renderList)
      );
    } catch (err) {
      console.error(err);
      if (grid) {
        grid.innerHTML = '<p class="error">Unable to load teammates from the API.</p>';
      }
      if (profile) {
        profile.innerHTML = '<p>Unable to load teammate profile.</p>';
      }
    }
  }

  function initAdmin() {
    const adminRoot = $('#admin');
    if (!adminRoot) return;

    const loginSection = $('#admin-login');
    const panelSection = $('#admin-panel');
    const loginForm = $('#login-form');
    const loginError = $('#login-error');
    const logoutBtn = $('#logout');
    const select = $('#teammate-select');
    const form = $('#teammate-form');
    const deleteBtn = $('#delete');
    const statusEl = $('#form-status');
    const ADMIN_TOKEN_KEY = 'teammate-db-admin-token';
    let currentSlug = '';

    function getToken() {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    }

    function setToken(token) {
      if (token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    }

    function showPanel(show) {
      if (show) {
        loginSection.hidden = true;
        panelSection.hidden = false;
      } else {
        loginSection.hidden = false;
        panelSection.hidden = true;
      }
    }

    function listToInput(value) {
      return (value || []).join(', ');
    }

    function populateSelect() {
      select.querySelectorAll('option[data-slug]').forEach((o) => o.remove());
      const items = TEAM.slice().sort((a, b) => a.name.localeCompare(b.name));
      items.forEach((item) => {
        const opt = document.createElement('option');
        opt.value = item.slug;
        opt.dataset.slug = item.slug;
        opt.textContent = item.name;
        select.appendChild(opt);
      });
    }

    function fillForm(slug) {
      const teammate = TEAM.find((t) => t.slug === slug);
      currentSlug = teammate ? teammate.slug : '';
      deleteBtn.disabled = !currentSlug;
      form.reset();
      if (!teammate) return;
      const entries = {
        order: teammate.order ?? '',
        slug: teammate.slug,
        name: teammate.name,
        role: teammate.role,
        jobTitle: teammate.jobTitle || '',
        nmls: teammate.nmls || '',
        phone: teammate.phone || '',
        email: teammate.email || '',
        location: teammate.location || '',
        hireDate: teammate.hireDate || '',
        bio: teammate.bio || '',
        specialties: listToInput(teammate.specialties),
        certifications: listToInput(teammate.certifications),
        languages: listToInput(teammate.languages),
        states: listToInput(teammate.states),
        funFact: teammate.funFact || '',
        apply: teammate.links?.apply || '',
        calendly: teammate.links?.calendly || '',
        linkedin: teammate.links?.linkedin || '',
        reviews: teammate.links?.reviews || '',
        personalSite: teammate.links?.personalSite || '',
        facebook: teammate.socialHandles?.facebook || '',
        instagram: teammate.socialHandles?.instagram || '',
        socialLinkedin: teammate.socialHandles?.linkedin || '',
        twitter: teammate.socialHandles?.twitter || '',
        tiktok: teammate.socialHandles?.tiktok || '',
        photoFile: teammate.photoFile || '',
      };
      Object.entries(entries).forEach(([name, value]) => {
        if (name in form.elements) {
          form.elements[name].value = value;
        }
      });
    }

    function setStatus(message, isError = false) {
      statusEl.textContent = message;
      statusEl.style.color = isError ? '#dc2626' : 'var(--lh-blue)';
    }

    async function refreshTeam() {
      try {
        await loadTeam();
        populateSelect();
        if (currentSlug) {
          fillForm(currentSlug);
        }
        renderList();
        renderProfile();
      } catch (err) {
        console.error(err);
        setStatus('Unable to refresh team data', true);
      }
    }

    function prepareLists(fd, names) {
      names.forEach((name) => {
        const value = form.elements[name]?.value || '';
        const list = value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
        fd.set(name, list.join(','));
      });
    }

    async function authenticatedFetch(url, options = {}) {
      const token = getToken();
      const headers = { ...(options.headers || {}) };
      if (token) {
        headers['x-admin-token'] = token;
      }
      return fetch(url, { ...options, headers });
    }

    async function tryLogin(credentials) {
      const res = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      const data = await res.json();
      setToken(data.token);
      showPanel(true);
      loginError.textContent = '';
      await refreshTeam();
    }

    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const password = formData.get('password');
      if (!password) return;
      try {
        await tryLogin({ password });
      } catch (err) {
        loginError.textContent = err.message;
      }
    });

    logoutBtn?.addEventListener('click', () => {
      setToken(null);
      showPanel(false);
      loginForm.reset();
      TEAM = [];
      select.querySelectorAll('option[data-slug]').forEach((o) => o.remove());
      deleteBtn.disabled = true;
      setStatus('');
    });

    select?.addEventListener('change', (e) => {
      const slug = e.target.value;
      fillForm(slug);
      setStatus('');
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const formData = new FormData(form);
      prepareLists(formData, ['specialties', 'certifications', 'languages', 'states']);
      if (!form.elements.photo?.files?.length) {
        formData.delete('photo');
      }
      const slug = formData.get('slug');
      const isUpdate = Boolean(currentSlug);
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate
        ? `${API_BASE}/teammates/${encodeURIComponent(currentSlug)}`
        : `${API_BASE}/teammates`;
      setStatus('Saving…');
      try {
        const res = await authenticatedFetch(url, {
          method,
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to save teammate');
        }
        const saved = await res.json();
        setStatus('Changes saved');
        currentSlug = saved.slug;
        await refreshTeam();
        select.value = currentSlug;
      } catch (err) {
        console.error(err);
        setStatus(err.message, true);
      }
    });

    deleteBtn?.addEventListener('click', async () => {
      if (!currentSlug) return;
      if (!confirm('Delete this teammate? This cannot be undone.')) return;
      setStatus('Deleting…');
      try {
        const res = await authenticatedFetch(
          `${API_BASE}/teammates/${encodeURIComponent(currentSlug)}`,
          { method: 'DELETE' }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to delete teammate');
        }
        setStatus('Teammate deleted');
        currentSlug = '';
        select.value = '';
        form.reset();
        await refreshTeam();
        deleteBtn.disabled = true;
      } catch (err) {
        console.error(err);
        setStatus(err.message, true);
      }
    });

    // attempt auto login with stored token
    const storedToken = getToken();
    if (storedToken) {
      tryLogin({ token: storedToken }).catch(() => {
        setToken(null);
        showPanel(false);
      });
    }
  }

  await bootstrapPublicPages();
  initAdmin();
})();
