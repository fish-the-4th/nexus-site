/* ==========================================================
   Nexus website script
   Links you might want to change are in the NEXUS object.
   ========================================================== */
const NEXUS = {
  invite:  'https://discord.com/oauth2/authorize?client_id=1516923666787602725&permissions=8&integration_type=0&scope=bot',
  support: 'https://discord.gg/grVrz6TrsY',
  topgg:   'https://top.gg/bot/1516923666787602725'
};

/* ---------- tiny helpers ---------- */
function el(tag, attrs, kids) {
  const e = document.createElement(tag);
  for (const k in (attrs || {})) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else if (k === 'style') e.setAttribute('style', attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  (kids || []).forEach(c => e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return e;
}

async function loadJSON(path) {
  // The minute-based suffix keeps GitHub's cache from showing stale data for long
  const res = await fetch(path + '?v=' + Math.floor(Date.now() / 60000), { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load ' + path);
  return res.json();
}

function safeColor(c, fallback) {
  return (typeof c === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.trim())) ? c.trim() : (fallback || '#5865F2');
}

function fmtDate(str, withTime) {
  if (!str) return '';
  let d;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (m) d = new Date(+m[1], +m[2] - 1, +m[3]);   // date only, keep it in local time
  else d = new Date(str);
  if (isNaN(d)) return str;
  const opts = { year: 'numeric', month: 'short', day: 'numeric' };
  if (withTime && !m) { opts.hour = 'numeric'; opts.minute = '2-digit'; }
  return d.toLocaleString(undefined, opts);
}

/* ---------- shared nav + footer ---------- */
function buildChrome() {
  const page = document.body.dataset.page || '';
  const links = [
    ['home', 'index.html', 'Home'],
    ['about', 'about.html', 'About'],
    ['docs', 'docs.html', 'Docs'],
    ['status', 'status.html', 'Status'],
    ['staff', 'staff.html', 'Staff']
  ];

  const navHost = document.getElementById('site-nav');
  if (navHost) {
    const nav = el('nav', { class: 'site-nav' });
    const wrap = el('div', { class: 'wrap' });
    const brand = el('a', { class: 'nav-brand', href: 'index.html' }, [
      el('img', { src: 'assets/logo.png', alt: '', width: '28', height: '28' }), 'Nexus'
    ]);
    const list = el('div', { class: 'nav-links', id: 'nav-links' });
    links.forEach(([id, href, label]) => {
      list.appendChild(el('a', { href, class: id === page ? 'active' : '', text: label }));
    });
    list.appendChild(el('a', { href: NEXUS.support, text: 'Support' }));
    list.appendChild(el('a', { href: NEXUS.invite, class: 'nav-cta', text: 'Add Nexus' }));
    const toggle = el('button', { class: 'nav-toggle', 'aria-label': 'Menu', text: '☰' });
    toggle.addEventListener('click', () => list.classList.toggle('open'));
    wrap.appendChild(brand); wrap.appendChild(list); wrap.appendChild(toggle);
    nav.appendChild(wrap);
    navHost.replaceWith(nav);
  }

  const footHost = document.getElementById('site-footer');
  if (footHost) {
    const f = el('footer', { class: 'site-footer' });
    f.innerHTML =
      '<div class="wrap">' +
        '<div class="footer-grid">' +
          '<div><div class="footer-brand"><img src="assets/logo.png" alt="">Nexus</div>' +
          '<p class="footer-note">Built on logic, built for everyone.</p></div>' +
          '<div><h6>Nexus</h6><a href="index.html">Home</a><a href="about.html">About</a><a href="staff.html">Staff</a></div>' +
          '<div><h6>Help</h6><a href="docs.html">Documentation</a><a href="status.html">Status</a><a href="' + NEXUS.support + '">Support server</a></div>' +
          '<div><h6>Get Nexus</h6><a href="' + NEXUS.invite + '">Add to your server</a><a href="' + NEXUS.topgg + '">top.gg listing</a></div>' +
        '</div>' +
        '<div class="footer-bottom">Nexus is an independent project and is not affiliated with Discord Inc.</div>' +
      '</div>';
    footHost.replaceWith(f);
  }

  document.querySelectorAll('[data-link]').forEach(a => {
    const url = NEXUS[a.dataset.link];
    if (url) a.setAttribute('href', url);
  });
}

/* ---------- status helpers ---------- */
const STATE_LABEL = {
  operational: 'Operational',
  degraded: 'Degraded performance',
  outage: 'Outage',
  maintenance: 'Under maintenance'
};
const STATE_RANK = { operational: 0, maintenance: 1, degraded: 2, outage: 3 };
const OVERALL_TEXT = {
  operational: 'All systems operational',
  maintenance: 'Scheduled maintenance in progress',
  degraded: 'Some systems are running slower than usual',
  outage: 'Some systems are down right now'
};
function normState(s) { return STATE_RANK.hasOwnProperty(s) ? s : 'operational'; }
function overallState(components) {
  let worst = 'operational';
  (components || []).forEach(c => {
    const s = normState(c.status);
    if (STATE_RANK[s] > STATE_RANK[worst]) worst = s;
  });
  return worst;
}

/* ---------- home page: little status pill ---------- */
async function initHome() {
  const host = document.getElementById('status-pill');
  if (!host) return;
  try {
    const data = await loadJSON('data/status.json');
    const o = overallState(data.components);
    host.className = 'status-pill';
    host.innerHTML = '';
    host.appendChild(el('span', { class: 'dot ' + o }));
    host.appendChild(document.createTextNode(OVERALL_TEXT[o]));
    host.style.display = 'inline-flex';
  } catch (e) { /* no pill if the data isn't available */ }
}

/* ---------- status page ---------- */
async function initStatus() {
  const root = document.getElementById('status-root');
  if (!root) return;
  let data;
  try { data = await loadJSON('data/status.json'); }
  catch (e) { root.appendChild(el('p', { class: 'empty', text: 'The status information could not be loaded right now. Try again in a minute.' })); return; }

  root.innerHTML = '';
  const o = overallState(data.components);
  const banner = el('div', { class: 'banner ' + o }, [
    el('span', { class: 'dot ' + o }),
    el('div', {}, [
      el('h2', { text: OVERALL_TEXT[o] }),
      el('small', { text: data.updated ? 'Last updated ' + fmtDate(data.updated, true) : '' })
    ])
  ]);
  root.appendChild(banner);

  const comps = el('div', { class: 'components' });
  (data.components || []).forEach(c => {
    const s = normState(c.status);
    comps.appendChild(el('div', { class: 'component' }, [
      el('div', {}, [
        el('div', { class: 'name', text: c.name || 'Unnamed' }),
        c.note ? el('div', { class: 'note', text: c.note }) : ''
      ].filter(Boolean)),
      el('span', { class: 'state ' + s }, [el('span', { class: 'dot ' + s }), STATE_LABEL[s]])
    ]));
  });
  root.appendChild(comps);

  const incidents = (data.incidents || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const active = incidents.filter(i => i.status !== 'resolved');
  const past = incidents.filter(i => i.status === 'resolved');

  function renderIncident(i) {
    const box = el('div', { class: 'incident' });
    box.appendChild(el('div', { class: 'incident-head' }, [
      el('h3', { text: i.title || 'Incident' }),
      el('span', { class: 'tag ' + (i.status || ''), text: i.status || 'update' })
    ]));
    box.appendChild(el('div', { class: 'date', text: fmtDate(i.date) }));
    if (i.message) box.appendChild(el('p', { text: i.message }));
    if (Array.isArray(i.updates) && i.updates.length) {
      const u = el('div', { class: 'updates' });
      i.updates.forEach(x => u.appendChild(el('div', {}, [
        el('div', { class: 'u-date', text: fmtDate(x.date, true) }),
        el('div', { class: 'u-text', text: x.text || '' })
      ])));
      box.appendChild(u);
    }
    return box;
  }

  if (active.length) {
    root.appendChild(el('h2', { class: 'sub-title', text: 'Current incidents' }));
    active.forEach(i => root.appendChild(renderIncident(i)));
  }
  root.appendChild(el('h2', { class: 'sub-title', text: 'Past incidents' }));
  if (past.length) past.forEach(i => root.appendChild(renderIncident(i)));
  else root.appendChild(el('p', { class: 'empty', text: 'No incidents reported.' }));
}

/* ---------- staff page ---------- */
function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p.charAt(0).toUpperCase()).join('') || '?';
}

async function initStaff() {
  const root = document.getElementById('staff-root');
  if (!root) return;
  let data;
  try { data = await loadJSON('data/staff.json'); }
  catch (e) { root.appendChild(el('p', { class: 'empty', text: 'The staff list could not be loaded right now. Try again in a minute.' })); return; }

  root.innerHTML = '';
  (data.sections || []).forEach(sec => {
    const members = sec.members || [];
    const s = el('section', { class: 'staff-section', id: sec.id || '' });
    s.appendChild(el('h2', {}, [sec.title || 'Team', el('span', { class: 'count', text: String(members.length) })]));
    if (!members.length) {
      s.appendChild(el('p', { class: 'staff-empty', text: 'Nobody here yet.' }));
    } else {
      const grid = el('div', { class: 'staff-grid' });
      members.forEach(m => {
        const color = safeColor(m.color);
        const card = el('div', { class: 'member', style: '--rc:' + color });
        const name = m.displayName || m.username || 'Unknown';
        let av;
        if (m.avatar) {
          av = el('img', { class: 'avatar', src: m.avatar, alt: '', loading: 'lazy' });
          av.addEventListener('error', () => {
            const fb = el('div', { class: 'avatar', style: 'background:' + color, text: initials(name) });
            av.replaceWith(fb);
          });
        } else {
          av = el('div', { class: 'avatar', style: 'background:' + color, text: initials(name) });
        }
        const who = el('div', { class: 'who' }, [
          el('div', { class: 'dn', text: name }),
          m.username ? el('div', { class: 'un', text: '@' + String(m.username).replace(/^@/, '') }) : '',
          m.rank ? el('span', { class: 'rank', text: m.rank }) : ''
        ].filter(Boolean));
        card.appendChild(av); card.appendChild(who);
        grid.appendChild(card);
      });
      s.appendChild(grid);
    }
    root.appendChild(s);
  });
}

/* ---------- docs page ---------- */
async function initDocs() {
  const host = document.getElementById('cmd-root');
  if (!host) return;
  const sideHost = document.getElementById('side-cmds');
  let cats;
  try { cats = await loadJSON('data/commands.json'); }
  catch (e) { host.appendChild(el('p', { class: 'empty', text: 'The command list could not be loaded right now.' })); return; }

  const catEls = [];
  cats.forEach(cat => {
    const wrap = el('div', { class: 'cmd-cat', id: 'cmd-' + cat.id });
    wrap.appendChild(el('h3', { text: cat.name }));
    if (cat.intro) wrap.appendChild(el('p', { class: 'intro', text: cat.intro }));
    const list = el('div', { class: 'cmd-list' });
    const rows = [];
    cat.commands.forEach(c => {
      const hasPerm = c.perms && c.perms !== 'None';
      const row = el('div', { class: 'cmd' }, [
        el('div', { class: 'usage', text: c.usage }),
        el('div', { class: 'desc', text: c.desc }),
        el('span', { class: 'perm' + (hasPerm ? ' has' : ''), text: hasPerm ? c.perms : 'Everyone' })
      ]);
      row.dataset.search = (c.usage + ' ' + c.desc + ' ' + (c.perms || '') + ' ' + cat.name).toLowerCase();
      list.appendChild(row); rows.push(row);
    });
    wrap.appendChild(list);
    if (cat.note) wrap.appendChild(el('p', { class: 'note', text: cat.note }));
    host.appendChild(wrap);
    catEls.push({ wrap, rows });
    if (sideHost) sideHost.appendChild(el('a', { href: '#cmd-' + cat.id, text: cat.name }));
  });

  const none = el('p', { class: 'empty', text: 'No commands match that search.' });
  none.style.display = 'none';
  host.appendChild(none);

  const input = document.getElementById('cmd-search');
  if (input) input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let any = false;
    catEls.forEach(({ wrap, rows }) => {
      let shown = 0;
      rows.forEach(r => {
        const ok = !q || q.split(/\s+/).every(w => r.dataset.search.includes(w));
        r.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      wrap.style.display = shown ? '' : 'none';
      if (shown) any = true;
    });
    none.style.display = any ? 'none' : '';
  });

  // highlight the section you are reading in the sidebar
  const links = Array.from(document.querySelectorAll('.docs-side a[href^="#"]'));
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting && map.has(en.target.id)) {
          links.forEach(l => l.classList.remove('active'));
          map.get(en.target.id).classList.add('active');
        }
      });
    }, { rootMargin: '-90px 0px -70% 0px' });
    map.forEach((_, id) => { const t = document.getElementById(id); if (t) io.observe(t); });
  }
}

/* ---------- start ---------- */
document.addEventListener('DOMContentLoaded', () => {
  buildChrome();
  initHome();
  initStatus();
  initStaff();
  initDocs();
});
