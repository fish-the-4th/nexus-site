const ROOT = '../';
const DATA = '../Data/';

const NEXUS = {
  invite:  'https://discord.com/oauth2/authorize?client_id=1516923666787602725&permissions=8&integration_type=0&scope=bot',
  support: 'https://discord.gg/grVrz6TrsY',
  topgg:   'https://top.gg/bot/1516923666787602725'
};

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
  const res = await fetch(DATA + path + '?v=' + Math.floor(Date.now() / 60000), { cache: 'no-store' });
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
  if (m) d = new Date(+m[1], +m[2] - 1, +m[3]);
  else d = new Date(str);
  if (isNaN(d)) return str;
  const opts = { year: 'numeric', month: 'short', day: 'numeric' };
  if (withTime && !m) { opts.hour = 'numeric'; opts.minute = '2-digit'; }
  return d.toLocaleString(undefined, opts);
}

function buildChrome() {
  const page = document.body.dataset.page || '';
  const links = [
    ['home', 'index.html', 'Home'],
    ['about', 'about.html', 'About'],
    ['docs', 'docs.html', 'Docs'],
    ['commands', 'commands.html', 'Commands'],
    ['status', 'status.html', 'Status'],
    ['staff', 'staff.html', 'Staff']
  ];
  const moreLinks = [
    ['compare', 'compare.html', 'Compare'],
    ['changelog', 'changelog.html', 'Changelog'],
    ['privacy', 'privacy.html', 'Privacy']
  ];

  const navHost = document.getElementById('site-nav');
  if (navHost) {
    const nav = el('nav', { class: 'site-nav' });
    const wrap = el('div', { class: 'wrap' });
    const brand = el('a', { class: 'nav-brand', href: 'index.html' }, [
      el('img', { src: ROOT + 'logo.png', alt: '', width: '28', height: '28' }), 'Nexus'
    ]);
    const list = el('div', { class: 'nav-links', id: 'nav-links' });
    links.forEach(([id, href, label]) => {
      list.appendChild(el('a', { href, class: id === page ? 'active' : '', text: label }));
    });

    const more = el('div', { class: 'nav-more' });
    const moreBtn = el('button', {
      class: 'nav-more-btn' + (moreLinks.some(l => l[0] === page) ? ' active' : ''),
      type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false'
    }, ['More ', el('span', { class: 'caret', text: '▾' })]);
    const menu = el('div', { class: 'nav-menu' });
    moreLinks.forEach(([id, href, label]) => {
      menu.appendChild(el('a', { href, class: id === page ? 'active' : '', text: label }));
    });
    const closeMore = () => { more.classList.remove('open'); moreBtn.setAttribute('aria-expanded', 'false'); };
    moreBtn.addEventListener('click', e => {
      e.stopPropagation();
      const open = more.classList.toggle('open');
      moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', e => { if (!more.contains(e.target)) closeMore(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMore(); });
    more.appendChild(moreBtn); more.appendChild(menu);
    list.appendChild(more);

    list.appendChild(el('a', { href: NEXUS.support, text: 'Support' }));
    list.appendChild(el('a', { href: 'dashboard.html', class: 'nav-cta' + (page === 'dashboard' ? ' active' : ''), text: 'Dashboard' }));
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
          '<div><div class="footer-brand"><img src="' + ROOT + 'logo.png" alt="">Nexus</div>' +
          '<p class="footer-note">Built on logic, built for everyone.</p></div>' +
          '<div><h6>Nexus</h6><a href="index.html">Home</a><a href="about.html">About</a><a href="staff.html">Staff</a></div>' +
          '<div><h6>Help</h6><a href="docs.html">Documentation</a><a href="commands.html">Commands</a><a href="status.html">Status</a><a href="' + NEXUS.support + '">Support server</a></div>' +
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

function fmtUptime(ms) {
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  if (d > 0) return d + 'd ' + h + 'h';
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm';
}

async function initHomeStats() {
  const host = document.getElementById('home-stats');
  if (!host) return;
  let stats;
  try { stats = await loadJSON('stats.json'); } catch (e) { return; }
  const pills = [];
  const servers = Number(stats.servers);
  if (isFinite(servers) && servers > 0) pills.push([servers.toLocaleString(), servers === 1 ? 'server' : 'servers']);
  const pct = Number(stats.uptime_percent);
  if (stats.uptime_percent !== null && stats.uptime_percent !== undefined && stats.uptime_percent !== '' && isFinite(pct) && pct >= 0 && pct <= 100) {
    pills.push([pct + '%', 'uptime' + (stats.uptime_period ? ', ' + stats.uptime_period : '')]);
  } else if (stats.online_since) {
    const since = new Date(stats.online_since);
    if (!isNaN(since) && since <= new Date()) pills.push([fmtUptime(Date.now() - since.getTime()), 'online since last restart']);
  }
  if (!pills.length) return;
  host.innerHTML = '';
  pills.forEach(([value, label]) => host.appendChild(el('div', { class: 'stat-pill' }, [el('b', { text: value }), el('span', { text: label })])));
  host.style.display = 'flex';
}

async function initCompare() {
  const root = document.getElementById('cmp-root');
  if (!root) return;
  let data;
  try { data = await loadJSON('compare.json'); }
  catch (e) { root.replaceChildren(el('p', { class: 'empty', text: 'The comparison could not be loaded right now. Try again in a minute.' })); return; }

  const bots = data.bots || [];
  const rows = data.rows || [];
  const table = el('table', { class: 'cmp-table' });
  const headRow = el('tr', {}, [el('th', { class: 'cmp-corner' })]);
  bots.forEach(b => {
    const logo = el('div', { class: 'cmp-logo' });
    if (b.logo) logo.appendChild(el('img', { src: ROOT + b.logo, alt: '' }));
    else logo.textContent = (b.name || '?').charAt(0);
    headRow.appendChild(el('th', { class: 'cmp-col-head' + (b.highlight ? ' win' : ''), scope: 'col' }, [
      el('span', { class: 'cmp-col-name', text: b.name }),
      el('div', { class: 'cmp-col-body' }, [
        logo,
        el('span', { class: 'cmp-badge' }, [el('span', { class: 'tick', text: '✓' }), b.badge || ''])
      ])
    ]));
  });
  table.appendChild(el('thead', {}, [headRow]));

  const body = el('tbody');
  rows.forEach(r => {
    const tr = el('tr', {}, [el('th', { class: 'cmp-row-label', scope: 'row' }, [el('span', { text: r.icon || '•' }), r.label || ''])]);
    bots.forEach(b => {
      const c = (r.cells || {})[b.id] || {};
      const cell = el('td', { class: 'cmp-cell' + (b.highlight ? ' win' : '') + (c.tone ? ' ' + c.tone : '') });
      cell.appendChild(el('span', { class: 'val', text: (c.shield ? '🛡 ' : '') + (c.text || '') }));
      if (typeof c.dots === 'number') {
        const dots = el('span', { class: 'cmp-dots', 'aria-label': c.dots + ' out of 5' });
        for (let i = 1; i <= 5; i++) dots.appendChild(el('i', { class: i <= c.dots ? 'on' : '' }));
        cell.appendChild(dots);
      }
      tr.appendChild(cell);
    });
    body.appendChild(tr);
  });
  table.appendChild(body);

  root.replaceChildren(el('div', { class: 'cmp-scroll' }, [table]));
  if (data.verdict) root.appendChild(el('div', { class: 'callout cmp-verdict' }, [el('strong', { text: 'The verdict. ' }), data.verdict]));
  if (data.note) root.appendChild(el('p', { class: 'cmp-note', text: data.note }));
}

async function initHome() {
  initHomeStats();
  const host = document.getElementById('status-pill');
  if (!host) return;
  try {
    const data = await loadJSON('status.json');
    const o = overallState(data.components);
    host.className = 'status-pill';
    host.innerHTML = '';
    host.appendChild(el('span', { class: 'dot ' + o }));
    host.appendChild(document.createTextNode(OVERALL_TEXT[o]));
    host.style.display = 'inline-flex';
  } catch (e) {}
}

async function initStatus() {
  const root = document.getElementById('status-root');
  if (!root) return;
  let data;
  try { data = await loadJSON('status.json'); }
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
  if (!active.length) root.appendChild(el('p', { class: 'empty', text: 'No current incidents.' }));
}

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function initDocs() {
  const root = document.getElementById('doc-root');
  const side = document.querySelector('.docs-side');
  if (!root || !side) return;

  const pages = Array.from(root.querySelectorAll('.doc-page'));
  const links = Array.from(side.querySelectorAll('a[data-doc]'));
  const order = links.map(a => a.dataset.doc);
  const byId = {};
  pages.forEach(p => { byId[p.dataset.doc] = p; });

  const LEGACY = {
    'g-moderation': 'moderation', 'g-automod': 'automod', 'g-logging': 'logging', 'g-tickets': 'tickets',
    'g-roles': 'roles', 'g-stats': 'stats', 'durations': 'time-formats', 'permissions': 'command-access',
    'getting-started': 'getting-started', 'troubleshooting': 'troubleshooting'
  };
  const LEGACY_PAGES = { 'commands': 'commands.html' };

  const titleOf = slug => (links.find(a => a.dataset.doc === slug) || {}).textContent.trim();

  pages.forEach(page => {
    const slug = page.dataset.doc;
    page.querySelectorAll('h2, h3').forEach(h => { if (!h.id) h.id = slug + '-' + slugify(h.textContent); });
    const h2s = Array.from(page.querySelectorAll('h2'));
    if (h2s.length >= 3) {
      const toc = el('div', { class: 'doc-toc' });
      h2s.forEach(h => toc.appendChild(el('a', { href: '#/' + slug + '/' + h.id.slice(slug.length + 1), text: h.textContent })));
      const after = page.querySelector('.lead') || page.querySelector('h1');
      if (after) after.insertAdjacentElement('afterend', toc);
    }
    const i = order.indexOf(slug);
    const pager = el('div', { class: 'pager' });
    if (i > 0) pager.appendChild(el('a', { class: 'prev', href: '#/' + order[i - 1] }, [el('small', { text: 'Previous' }), el('b', { text: titleOf(order[i - 1]) })]));
    if (i >= 0 && i < order.length - 1) pager.appendChild(el('a', { class: 'next', href: '#/' + order[i + 1] }, [el('small', { text: 'Next' }), el('b', { text: titleOf(order[i + 1]) })]));
    if (pager.children.length) page.appendChild(pager);
  });

  side.classList.add('collapsible');
  const menuBtn = document.getElementById('doc-menu');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = side.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  const search = document.getElementById('doc-search');
  const noMatch = document.getElementById('doc-nomatch');
  const index = {};
  pages.forEach(p => { index[p.dataset.doc] = (p.dataset.title + ' ' + p.textContent).toLowerCase(); });
  if (search) {
    search.addEventListener('input', () => {
      const terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      links.forEach(a => {
        const ok = !terms.length || terms.every(t => index[a.dataset.doc].includes(t));
        a.classList.toggle('hidden', !ok);
        if (ok) shown++;
      });
      side.querySelectorAll('h5').forEach(h => {
        let n = h.nextElementSibling, any = false;
        while (n && n.tagName !== 'H5') {
          if (n.matches('a[data-doc]') && !n.classList.contains('hidden')) any = true;
          n = n.nextElementSibling;
        }
        h.classList.toggle('hidden', terms.length > 0 && !any);
      });
      if (noMatch) noMatch.hidden = !terms.length || shown > 0;
    });
  }

  function show(slug, anchor) {
    if (!byId[slug]) slug = 'overview';
    pages.forEach(p => p.classList.toggle('active', p.dataset.doc === slug));
    links.forEach(a => a.classList.toggle('active', a.dataset.doc === slug));
    document.title = byId[slug].dataset.title + ' - Nexus Docs';
    side.classList.remove('open');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'false');
      const label = menuBtn.querySelector('span');
      if (label) label.textContent = byId[slug].dataset.title;
    }
    if (anchor) {
      const target = document.getElementById(slug + '-' + anchor);
      if (target) { target.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  }

  function route() {
    const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const parts = raw.split('/');
    const first = parts[0];
    if (LEGACY_PAGES[first]) { location.replace(LEGACY_PAGES[first]); return; }
    show(LEGACY[first] || first || 'overview', parts.slice(1).join('/'));
  }
  window.addEventListener('hashchange', route);
  route();
}

async function initChangelog() {
  const root = document.getElementById('changelog-root');
  if (!root) return;
  let entries;
  try { entries = await loadJSON('changelog.json'); }
  catch (e) { root.innerHTML = ''; root.appendChild(el('p', { class: 'empty', text: 'The changelog could not be loaded right now. Try again in a minute.' })); return; }

  root.innerHTML = '';
  if (!Array.isArray(entries) || !entries.length) {
    root.appendChild(el('p', { class: 'empty', text: 'Nothing here yet.' }));
    return;
  }
  entries.forEach(entry => {
    const box = el('div', { class: 'incident' });
    box.appendChild(el('div', { class: 'incident-head' }, [
      el('h3', { text: entry.title || 'Update' }),
      el('span', { class: 'tag', text: entry.type || 'update' })
    ]));
    box.appendChild(el('div', { class: 'date', text: fmtDate(entry.date) }));
    const lines = String(entry.text || '').split('\n').map(l => l.trim()).filter(Boolean);
    const bullets = lines.filter(l => l.startsWith('- '));
    if (bullets.length === lines.length) {
      const ul = el('ul', {});
      bullets.forEach(l => ul.appendChild(el('li', { text: l.slice(2) })));
      box.appendChild(ul);
    } else {
      lines.forEach(l => box.appendChild(el('p', { text: l.replace(/^- /, '') })));
    }
    root.appendChild(box);
  });
}

async function initFaq() {
  const root = document.getElementById('faq-root');
  if (!root) return;
  let groups;
  try { groups = await loadJSON('faq.json'); }
  catch (e) { root.innerHTML = ''; root.appendChild(el('p', { class: 'empty', text: 'The FAQ could not be loaded right now. Try again in a minute.' })); return; }

  root.innerHTML = '';
  (Array.isArray(groups) ? groups : []).forEach(group => {
    if (group.title && !(root.dataset.heading && groups.length === 1)) root.appendChild(el(root.dataset.heading || 'h2', { text: group.title }));
    (group.items || []).forEach(item => {
      root.appendChild(el('details', { class: 'faq' }, [
        el('summary', { text: item.q || '' }),
        el('div', { class: 'a' }, [el('p', { text: item.a || '' })])
      ]));
    });
  });
  if (!root.children.length) root.appendChild(el('p', { class: 'empty', text: 'No questions yet.' }));
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p.charAt(0).toUpperCase()).join('') || '?';
}

async function initStaff() {
  const root = document.getElementById('staff-root');
  if (!root) return;
  let data;
  try { data = await loadJSON(root.dataset.source || 'staff.json'); }
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
        const avatarSrc = m.avatar && !/^https?:/.test(m.avatar) ? ROOT + m.avatar : m.avatar;
        const name = m.displayName || m.username || 'Unknown';
        let av;
        if (m.avatar) {
          av = el('img', { class: 'avatar', src: avatarSrc, alt: '', loading: 'lazy' });
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

const INTENT_STOP = new Set(['the', 'a', 'an', 'to', 'of', 'how', 'do', 'i', 'can', 'my', 'me', 'someone', 'somebody', 'in', 'on', 'for', 'with', 'is', 'it', 'and', 'or', 'what', 'who', 'want', 'need', 'that', 'this', 'you', 'your', 'we', 'our', 'please', 'from', 'up']);

function intentWords(text) {
  return String(text).toLowerCase().split(/[^a-z0-9]+/)
    .filter(w => w.length >= 2 && !INTENT_STOP.has(w))
    .map(w => { const s = w.replace(/(ing|ed|es|s|e)$/, ''); return s.length >= 3 ? s : w; });
}

function intentWordMatch(q, w) {
  return q === w || (q.length >= 3 && w.startsWith(q)) || (w.length >= 3 && q.startsWith(w));
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {   }
  try {
    const ta = el('textarea', { style: 'position:fixed;opacity:0;top:0;left:0', 'aria-hidden': 'true' });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) { return false; }
}

function permList(perms) {
  if (!perms || /^none/i.test(perms)) return [];
  return perms.split('/').map(s => s.trim()).filter(s => s && !/^none/i.test(s));
}

async function initCommands() {
  const host = document.getElementById('cmd-root');
  if (!host) return;
  const sideHost = document.getElementById('side-cmds');
  let cats;
  try { cats = await loadJSON('commands.json'); }
  catch (e) { host.appendChild(el('p', { class: 'empty', text: 'The command list could not be loaded right now.' })); return; }

  const catEls = [];
  const allRows = [];
  const permNames = new Set();

  cats.forEach(cat => {
    const wrap = el('div', { class: 'cmd-cat', id: 'cmd-' + cat.id });
    wrap.appendChild(el('h3', { text: cat.name }));
    if (cat.intro) wrap.appendChild(el('p', { class: 'intro', text: cat.intro }));
    const list = el('div', { class: 'cmd-list' });
    const rows = [];
    cat.commands.forEach(c => {
      const needs = permList(c.perms);
      needs.forEach(n => { if (!/support role/i.test(n)) permNames.add(n); });

      const copyBtn = el('button', { class: 'copy', type: 'button', 'aria-label': 'Copy ' + c.usage.split('[')[0].trim(), text: 'Copy' });
      const cleanUsage = c.usage.replace(/\s*\(alias:[^)]*\)/i, '').trim();
      copyBtn.addEventListener('click', async () => {
        const ok = await copyText(cleanUsage);
        copyBtn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
        copyBtn.classList.toggle('done', ok);
        setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('done'); }, 1400);
      });

      const row = el('div', { class: 'cmd' }, [
        el('div', { class: 'usage', text: c.usage }),
        el('div', { class: 'desc', text: c.desc }),
        el('div', { class: 'cmd-side' }, [
          el('span', { class: 'perm' + (needs.length ? ' has' : ''), text: needs.length ? c.perms : 'Everyone' }),
          copyBtn
        ])
      ]);
      row.dataset.search = (c.usage + ' ' + c.desc + ' ' + (c.perms || '') + ' ' + cat.name).toLowerCase();
      row._cmd = c.usage.split('[')[0].split('(')[0].trim().toLowerCase();
      row._needs = needs;
      list.appendChild(row); rows.push(row); allRows.push(row);
    });
    wrap.appendChild(list);
    if (cat.note) wrap.appendChild(el('p', { class: 'note', text: cat.note }));
    host.appendChild(wrap);
    catEls.push({ wrap, rows });
    if (sideHost) sideHost.appendChild(el('a', { href: '#cmd-' + cat.id, text: cat.name }));
  });

  let intents = [];
  try {
    const raw = await loadJSON('intents.json');
    intents = raw.map(i => ({
      rows: allRows.filter(r => i.commands.some(c => r._cmd === c || r._cmd.startsWith(c + ' '))),
      phrases: i.phrases.map(intentWords)
    }));
  } catch (e) {   }

  function intentRows(query) {
    const q = intentWords(query);
    const hit = new Set();
    if (!q.length) return hit;
    intents.forEach(i => {
      if (i.phrases.some(ph => q.every(w => ph.some(pw => intentWordMatch(w, pw))))) i.rows.forEach(r => hit.add(r));
    });
    return hit;
  }

  const none = el('p', { class: 'empty', text: 'No commands match that. Try describing what you want to do, like "stop spam" or "give someone a role".' });
  none.style.display = 'none';
  host.appendChild(none);

  const input = document.getElementById('cmd-search');
  const permSel = document.getElementById('cmd-perm');
  const countEl = document.getElementById('cmd-count');
  const noteEl = document.getElementById('cmd-intent');

  if (permSel) {
    permSel.appendChild(el('option', { value: '', text: 'Any permission' }));
    permSel.appendChild(el('option', { value: '__everyone', text: 'Everyone (no permission needed)' }));
    Array.from(permNames).sort().forEach(n => permSel.appendChild(el('option', { value: n, text: n })));
  }

  function apply() {
    const q = input ? input.value.trim().toLowerCase() : '';
    const perm = permSel ? permSel.value : '';
    const words = q.split(/\s+/).filter(Boolean);
    const related = q ? intentRows(q) : new Set();
    let total = 0, onlyByIntent = 0;

    catEls.forEach(({ wrap, rows }) => {
      let shown = 0;
      rows.forEach(r => {
        const textOk = !words.length || words.every(w => r.dataset.search.includes(w));
        const intentOk = !textOk && related.has(r);
        let permOk = true;
        if (perm === '__everyone') permOk = r._needs.length === 0;
        else if (perm) permOk = r._needs.includes(perm);
        const show = (textOk || intentOk) && permOk;
        r.style.display = show ? '' : 'none';
        r.classList.toggle('related', show && intentOk);
        if (show) { shown++; total++; if (intentOk) onlyByIntent++; }
      });
      wrap.style.display = shown ? '' : 'none';
    });

    none.style.display = total ? 'none' : '';
    if (countEl) {
      let msg = total + (total === 1 ? ' command' : ' commands');
      if (perm === '__everyone') msg += ' anyone can use';
      else if (perm) msg += ' that need ' + perm + '. Administrators and the server owner can use every command.';
      countEl.textContent = msg;
    }
    if (noteEl) noteEl.hidden = !onlyByIntent;
  }

  if (input) input.addEventListener('input', apply);
  if (permSel) permSel.addEventListener('change', apply);
  apply();

  initSideSpy();
}

function initSideSpy() {
  const links = Array.from(document.querySelectorAll('.docs-side a[href^="#"]'));
  if (!links.length) return;
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

document.addEventListener('DOMContentLoaded', () => {
  buildChrome();
  initHome();
  initCompare();
  initStatus();
  initStaff();
  initCommands();
  initDocs();
  initChangelog();
  initFaq();
  if (!document.getElementById('cmd-root') && !document.getElementById('doc-root')) initSideSpy();
});
