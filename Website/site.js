const ROOT = '../';
const DATA = '../Data/';

const NEXUS = {
  invite:  'https://discord.com/oauth2/authorize?client_id=1516923666787602725&permissions=8&integration_type=0&scope=bot',
  support: 'https://discord.gg/grVrz6TrsY',
  topgg:   'https://top.gg/bot/1516923666787602725'
};

const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

function fmtAgo(str) {
  const d = new Date(str);
  if (isNaN(d)) return '';
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 90) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' minutes ago';
  if (s < 86400) { const h = Math.round(s / 3600); return h + (h === 1 ? ' hour ago' : ' hours ago'); }
  const days = Math.round(s / 86400);
  return days + (days === 1 ? ' day ago' : ' days ago');
}

function skeleton(n) {
  const s = el('div', { class: 'skeleton', 'aria-label': 'Loading' });
  for (let i = 0; i < (n || 3); i++) s.appendChild(el('i'));
  return s;
}

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/></svg>',
  docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/></svg>',
  status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',
  about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/></svg>',
  dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="9" rx="2"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="2"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2"/><rect x="3" y="15" width="7.5" height="6" rx="2"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>'
};

function svgIcon(name) {
  const s = el('span', { 'aria-hidden': 'true', style: 'display:inline-flex' });
  s.innerHTML = ICONS[name];
  return s;
}

const MEGA = [
  { title: 'Nexus', items: [
    ['home', 'index.html', 'Home', 'Everything Nexus does, at a glance.'],
    ['', 'index.html#compare', 'Compare', 'How Nexus stacks up against the popular bots.'],
    ['', 'invite', 'Add to your server', 'One click, free forever.', true]
  ] },
  { title: 'Learn', items: [
    ['docs', 'docs.html', 'Documentation', 'Guides for every feature, step by step.'],
    ['', 'docs.html#/commands', 'Command list', 'Search every command, or describe what you need.'],
    ['', 'docs.html#/getting-started', 'Getting started', 'Your first five minutes with Nexus.'],
    ['', 'docs.html#/troubleshooting', 'Troubleshooting', 'Fixes for the common problems.']
  ] },
  { title: 'Community', items: [
    ['about', 'about.html', 'About', 'Why Nexus exists and who builds it.'],
    ['', 'about.html#team', 'The team', 'The people behind the bot.'],
    ['', 'about.html#faq', 'FAQ', 'Common questions, answered once.'],
    ['', 'support', 'Support server', 'Ask questions and report bugs.', true],
    ['', 'topgg', 'Leave a review', 'Help other servers find Nexus.', true]
  ] },
  { title: 'Updates', items: [
    ['status', 'status.html', 'Status', 'Is everything running right now?'],
    ['', 'status.html#changelog', 'Changelog', 'What changed, and when.'],
    ['dashboard', 'dashboard.html', 'Dashboard', 'Your stats, or your server settings.'],
    ['privacy', 'privacy.html', 'Privacy', 'What Nexus keeps, and why.']
  ] }
];

function buildChrome() {
  const page = document.body.dataset.page || '';
  const links = [
    ['home', 'index.html', 'Home'],
    ['docs', 'docs.html', 'Docs'],
    ['status', 'status.html', 'Status'],
    ['about', 'about.html', 'About']
  ];

  const navHost = document.getElementById('site-nav');
  if (navHost) {
    const nav = el('nav', { class: 'site-nav', 'aria-label': 'Main' });
    const brand = el('a', { class: 'nav-brand', href: 'index.html' }, [
      el('img', { src: ROOT + 'logo.png', alt: '', width: '30', height: '30' }), el('span', { text: 'Nexus' })
    ]);
    const list = el('div', { class: 'nav-links' });
    const pill = el('span', { class: 'nav-pill', 'aria-hidden': 'true' });
    list.appendChild(pill);
    links.forEach(([id, href, label]) => list.appendChild(el('a', { href, class: id === page ? 'active' : '', text: label })));
    list.querySelectorAll('a').forEach(a => {
      a.addEventListener('mouseenter', () => {
        pill.style.width = a.offsetWidth + 'px';
        pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
        pill.style.opacity = '1';
      });
    });
    list.addEventListener('mouseleave', () => { pill.style.opacity = '0'; });

    const cta = el('a', { class: 'nav-cta' + (page === 'dashboard' ? ' active' : ''), href: 'dashboard.html' }, [svgIcon('dash'), el('span', { class: 'lbl', text: 'Dashboard' })]);
    const burger = el('button', { class: 'icon-btn burger', type: 'button', 'aria-label': 'Open menu', 'aria-expanded': 'false', 'aria-controls': 'mega' }, [el('span'), el('span'), el('span')]);
    nav.appendChild(brand);
    nav.appendChild(list);
    nav.appendChild(el('div', { class: 'nav-actions' }, [cta, burger]));

    const mega = el('div', { class: 'mega', id: 'mega', role: 'menu' });
    let i = 0;
    MEGA.forEach(group => {
      const col = el('div', {}, [el('h6', { text: group.title })]);
      group.items.forEach(([id, href, label, desc, ext]) => {
        const a = el('a', { href: ext ? NEXUS[href] : href, class: id && id === page ? 'active' : '', style: '--i:' + (i++), role: 'menuitem' }, [el('b', { text: label }), el('small', { text: desc })]);
        if (ext) { a.setAttribute('data-ext', ''); a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
        col.appendChild(a);
      });
      mega.appendChild(col);
    });
    const scrim = el('div', { class: 'mega-scrim' });

    const setMenu = open => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    burger.addEventListener('click', e => { e.stopPropagation(); setMenu(!document.body.classList.contains('menu-open')); });
    scrim.addEventListener('click', () => setMenu(false));
    mega.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

    navHost.replaceWith(nav);
    nav.after(scrim);
    scrim.after(mega);

    const dock = el('nav', { class: 'dock', 'aria-label': 'Quick links' });
    [['home', 'index.html', 'Home', 'home'], ['docs', 'docs.html', 'Docs', 'docs'], ['status', 'status.html', 'Status', 'status'], ['about', 'about.html', 'About', 'about'], ['dashboard', 'dashboard.html', 'Dashboard', 'dash']]
      .forEach(([id, href, label, icon]) => dock.appendChild(el('a', { href, class: id === page ? 'active' : '' }, [svgIcon(icon), el('span', { text: label })])));
    document.body.appendChild(dock);

    const bar = el('div', { class: 'scroll-bar', 'aria-hidden': 'true' });
    const top = el('button', { class: 'icon-btn to-top', type: 'button', 'aria-label': 'Back to top' }, [svgIcon('up')]);
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }));
    document.body.appendChild(bar);
    document.body.appendChild(top);

    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      nav.classList.toggle('scrolled', y > 20);
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      top.classList.toggle('show', y > 700);
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  const footHost = document.getElementById('site-footer');
  if (footHost) {
    const f = el('footer', { class: 'site-footer' });
    const col = (title, items) => el('div', {}, [el('h6', { text: title })].concat(items.map(([href, label, ext]) => {
      const a = el('a', { href: ext ? NEXUS[href] : href, text: label });
      if (ext) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
      return a;
    })));
    const wrap = el('div', { class: 'wrap' }, [
      el('div', { class: 'footer-grid' }, [
        el('div', {}, [
          el('div', { class: 'footer-brand' }, [el('img', { src: ROOT + 'logo.png', alt: '' }), 'Nexus']),
          el('p', { class: 'footer-note', text: 'Built on logic, built for everyone.' })
        ]),
        col('Nexus', [['index.html', 'Home'], ['index.html#compare', 'Compare'], ['about.html', 'About'], ['about.html#team', 'The team']]),
        col('Help', [['docs.html', 'Documentation'], ['docs.html#/commands', 'Commands'], ['status.html', 'Status'], ['support', 'Support server', true]]),
        col('More', [['invite', 'Add to your server', true], ['dashboard.html', 'Dashboard'], ['status.html#changelog', 'Changelog'], ['privacy.html', 'Privacy']])
      ]),
      el('div', { class: 'footer-bottom' }, [
        el('span', { text: 'Nexus is an independent project and is not affiliated with Discord Inc.' }),
        el('span', { text: '© ' + new Date().getFullYear() + ' Nexus' })
      ])
    ]);
    f.appendChild(wrap);
    f.appendChild(el('div', { class: 'footer-word', 'aria-hidden': 'true', text: 'Nexus' }));
    footHost.replaceWith(f);
  }

  document.querySelectorAll('[data-link]').forEach(a => {
    const url = NEXUS[a.dataset.link];
    if (url) a.setAttribute('href', url);
  });
}

const REVEAL_SELECTOR = '.section-head, .tile, .card, .member, .component, .incident, .tl-item, details.faq, .cmp-scroll, .cmp-verdict, .cta-band, .quote, .marquee, .staff-section > h2, .reveal-me';
let revealObserver = null;

function reveal(scope) {
  const nodes = Array.from((scope || document).querySelectorAll(REVEAL_SELECTOR))
    .filter(n => !n.closest('.doc-page, #dash-root, .mega') && !n.classList.contains('reveal'));
  if (scope && scope.matches && scope.matches(REVEAL_SELECTOR) && !scope.classList.contains('reveal')) nodes.unshift(scope);
  if (!nodes.length) return;
  const counts = new Map();
  nodes.forEach(n => {
    const parent = n.parentElement;
    const k = counts.get(parent) || 0;
    counts.set(parent, k + 1);
    n.style.setProperty('--d', Math.min(k, 8) * 70 + 'ms');
    n.classList.add('reveal');
    if (n.matches('.tile, .card, .member, .component')) n.classList.add('spot');
  });
  if (REDUCED || !('IntersectionObserver' in window)) { nodes.forEach(n => n.classList.add('in')); return; }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  nodes.forEach(n => revealObserver.observe(n));
}

function initSpotlight() {
  document.addEventListener('pointermove', e => {
    const t = e.target.closest && e.target.closest('.spot');
    if (!t) return;
    const r = t.getBoundingClientRect();
    t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
}

function countUp(node, target, suffix) {
  const fmt = v => Math.round(v).toLocaleString() + (suffix || '');
  if (REDUCED) { node.textContent = fmt(target); return; }
  const run = () => {
    const start = performance.now();
    const dur = 1400;
    const step = now => {
      const p = Math.min(1, (now - start) / dur);
      node.textContent = fmt(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); run(); } });
    io.observe(node);
  } else run();
}

function initMarquee() {
  document.querySelectorAll('.marquee-track').forEach(track => {
    if (track.dataset.cloned) return;
    track.dataset.cloned = '1';
    Array.from(track.children).forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); track.appendChild(k); });
  });
}

function initCounters() {
  document.querySelectorAll('[data-count]').forEach(n => countUp(n, Number(n.dataset.count), n.dataset.suffix || ''));
}

const STATE_LABEL = {
  operational: 'Operational',
  degraded: 'Degraded performance',
  outage: 'Outage',
  maintenance: 'Under maintenance'
};
const STATE_RANK = { operational: 0, maintenance: 1, degraded: 2, outage: 3 };
const STATE_COLOR = { operational: 'var(--green)', maintenance: 'var(--blue)', degraded: 'var(--yellow)', outage: 'var(--red)' };
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

function statPill(value, label, count) {
  const b = el('b', { text: count ? '0' : value });
  if (count) countUp(b, count.value, count.suffix);
  return el('div', { class: 'stat-pill rise', style: '--d:' + (400 + 0) + 'ms' }, [b, el('span', { text: label })]);
}

async function initHomeStats() {
  const host = document.getElementById('home-stats');
  if (!host) return;
  const pills = [];
  try {
    const stats = await loadJSON('stats.json');
    const servers = Number(stats.servers);
    if (isFinite(servers) && servers > 0) pills.push(statPill('', servers === 1 ? 'server' : 'servers', { value: servers }));
    const pct = Number(stats.uptime_percent);
    if (stats.uptime_percent !== null && stats.uptime_percent !== undefined && stats.uptime_percent !== '' && isFinite(pct) && pct >= 0 && pct <= 100) {
      pills.push(statPill(pct + '%', 'uptime' + (stats.uptime_period ? ', ' + stats.uptime_period : '')));
    } else if (stats.online_since) {
      const since = new Date(stats.online_since);
      if (!isNaN(since) && since <= new Date()) pills.push(statPill(fmtUptime(Date.now() - since.getTime()), 'online since last restart'));
    }
  } catch (e) {}
  try {
    const cats = await loadJSON('commands.json');
    const total = cats.reduce((n, c) => n + (c.commands || []).length, 0);
    if (total) pills.push(statPill('', 'commands', { value: total }));
  } catch (e) {}
  pills.push(statPill('', 'built-in games', { value: 10 }));
  host.replaceChildren.apply(host, pills);
  pills.forEach((p, i) => p.style.setProperty('--d', 350 + i * 90 + 'ms'));
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
  reveal(root);
}

async function initHome() {
  initHomeStats();
  const host = document.getElementById('status-pill');
  if (!host) return;
  try {
    const data = await loadJSON('status.json');
    const o = overallState(data.components);
    host.className = 'status-pill rise';
    host.replaceChildren(el('span', { class: 'dot ' + o }), document.createTextNode(OVERALL_TEXT[o]));
    host.style.display = 'inline-flex';
  } catch (e) {}
}

function renderIncident(i) {
  const live = i.status !== 'resolved';
  const box = el('div', { class: 'incident ' + (live ? 'live' : 'done') });
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

async function initStatus() {
  const root = document.getElementById('status-root');
  if (!root) return;
  root.replaceChildren(skeleton(2));
  let data;
  try { data = await loadJSON('status.json'); }
  catch (e) { root.replaceChildren(el('p', { class: 'empty', text: 'The status information could not be loaded right now. Try again in a minute.' })); return; }

  const o = overallState(data.components);
  const head = document.getElementById('status-headline');
  const dot = document.getElementById('status-dot');
  const meta = document.getElementById('status-meta');
  if (head) head.textContent = OVERALL_TEXT[o];
  if (dot) dot.className = 'dot ' + o;
  if (meta) {
    meta.replaceChildren();
    const comps = (data.components || []).length;
    meta.appendChild(el('span', { text: comps + (comps === 1 ? ' SYSTEM' : ' SYSTEMS') + ' WATCHED' }));
    if (data.updated) meta.appendChild(el('span', { text: 'UPDATED ' + fmtAgo(data.updated).toUpperCase(), title: fmtDate(data.updated, true) }));
  }

  root.replaceChildren();
  const comps = el('div', { class: 'components' });
  (data.components || []).forEach(c => {
    const s = normState(c.status);
    const card = el('div', { class: 'component' }, [
      el('div', { class: 'top' }, [
        el('div', { class: 'name', text: c.name || 'Unnamed' }),
        el('span', { class: 'state ' + s }, [el('span', { class: 'dot ' + s }), STATE_LABEL[s]])
      ])
    ]);
    if (c.note) card.appendChild(el('div', { class: 'note', text: c.note }));
    if (Array.isArray(c.history) && c.history.length) {
      const days = c.history.slice(-45);
      const meter = el('div', { class: 'meter', role: 'img', 'aria-label': 'Last ' + days.length + ' days' });
      days.forEach((h, i) => {
        const st = normState(h);
        meter.appendChild(el('i', { style: '--i:' + i + ';--c:' + STATE_COLOR[st], title: STATE_LABEL[st] }));
      });
      card.appendChild(meter);
      card.appendChild(el('div', { class: 'meter-axis' }, [el('span', { text: days.length + ' days ago' }), el('span', { text: 'Today' })]));
    }
    comps.appendChild(card);
  });
  root.appendChild(comps);

  const incidents = (data.incidents || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const active = incidents.filter(i => i.status !== 'resolved');
  const past = incidents.filter(i => i.status === 'resolved');

  root.appendChild(el('h2', { class: 'sub-title', text: 'Current incidents' }));
  if (active.length) active.forEach(i => root.appendChild(renderIncident(i)));
  else root.appendChild(el('div', { class: 'incident done' }, [el('div', { class: 'incident-head' }, [el('h3', { text: 'Nothing going on' }), el('span', { class: 'tag resolved', text: 'all clear' })]), el('p', { text: 'There are no open incidents right now.' })]));

  if (past.length) {
    root.appendChild(el('h2', { class: 'sub-title', text: 'Past incidents' }));
    past.slice(0, 10).forEach(i => root.appendChild(renderIncident(i)));
  }
  reveal(root);
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
  pages.forEach(p => { index[p.dataset.doc] = (p.dataset.title + ' ' + (p.dataset.keywords || '') + ' ' + p.textContent).toLowerCase(); });
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
    const docs = document.querySelector('.docs');
    if (docs && window.scrollY > docs.offsetTop - 110) window.scrollTo(0, docs.offsetTop - 110);
  }

  function route() {
    const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const parts = raw.split('/');
    const first = parts[0];
    show(LEGACY[first] || first || 'overview', parts.slice(1).join('/'));
  }
  window.addEventListener('hashchange', route);
  route();
}

function changelogCard(entry) {
  const card = el('div', { class: 'tl-card' });
  card.appendChild(el('div', { class: 'incident-head' }, [
    el('h3', { text: entry.title || 'Update' }),
    el('span', { class: 'tag', text: entry.type || 'update' })
  ]));
  const lines = String(entry.text || '').split('\n').map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => l.startsWith('- '));
  if (lines.length && bullets.length === lines.length) {
    const ul = el('ul', {});
    bullets.forEach(l => ul.appendChild(el('li', { text: l.slice(2) })));
    card.appendChild(ul);
  } else {
    lines.forEach(l => card.appendChild(el('p', { text: l.replace(/^- /, '') })));
  }
  return el('div', { class: 'tl-item' }, [el('div', { class: 'tl-date', text: fmtDate(entry.date) }), card]);
}

async function initChangelog() {
  const root = document.getElementById('changelog-root');
  if (!root) return;
  root.replaceChildren(skeleton(3));
  let entries;
  try { entries = await loadJSON('changelog.json'); }
  catch (e) { root.replaceChildren(el('p', { class: 'empty', text: 'The changelog could not be loaded right now. Try again in a minute.' })); return; }

  root.replaceChildren();
  if (!Array.isArray(entries) || !entries.length) {
    root.appendChild(el('p', { class: 'empty', text: 'Nothing here yet.' }));
    return;
  }
  const line = el('div', { class: 'timeline' });
  const FIRST = 5;
  entries.slice(0, FIRST).forEach(e => line.appendChild(changelogCard(e)));
  root.appendChild(line);
  if (entries.length > FIRST) {
    const more = el('button', { class: 'btn btn-outline tl-more', type: 'button', text: 'Show ' + (entries.length - FIRST) + ' older updates' });
    more.addEventListener('click', () => {
      const added = entries.slice(FIRST).map(changelogCard);
      added.forEach(n => line.appendChild(n));
      more.remove();
      reveal(line);
    });
    root.appendChild(more);
  }
  reveal(root);
}

async function initFaq() {
  const root = document.getElementById('faq-root');
  if (!root) return;
  root.replaceChildren(skeleton(4));
  let groups;
  try { groups = await loadJSON('faq.json'); }
  catch (e) { root.replaceChildren(el('p', { class: 'empty', text: 'The FAQ could not be loaded right now. Try again in a minute.' })); return; }

  root.replaceChildren();
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
  reveal(root);
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p.charAt(0).toUpperCase()).join('') || '?';
}

async function renderStaff(root) {
  root.replaceChildren(skeleton(2));
  let data;
  try { data = await loadJSON(root.dataset.source || 'staff.json'); }
  catch (e) { root.replaceChildren(el('p', { class: 'empty', text: 'The staff list could not be loaded right now. Try again in a minute.' })); return; }

  root.replaceChildren();
  (data.sections || []).forEach(sec => {
    const members = sec.members || [];
    const s = el('section', { class: 'staff-section', id: sec.id ? 'team-' + sec.id : '' });
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
  reveal(root);
}

function initStaff() {
  document.querySelectorAll('[data-staff]').forEach(root => {
    if (!root.closest('[hidden]')) renderStaff(root);
    else root._lazy = true;
  });
}

function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabs => {
    const buttons = Array.from(tabs.querySelectorAll('button[data-tab]'));
    const ind = el('span', { class: 'tab-ind', 'aria-hidden': 'true' });
    tabs.prepend(ind);
    const place = b => { ind.style.width = b.offsetWidth + 'px'; ind.style.transform = 'translateX(' + (b.offsetLeft - 5) + 'px)'; };
    const select = (b, focus) => {
      buttons.forEach(x => {
        const on = x === b;
        x.classList.toggle('on', on);
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        const panel = document.getElementById(x.dataset.tab);
        if (panel) panel.hidden = !on;
      });
      place(b);
      const panel = document.getElementById(b.dataset.tab);
      if (panel) panel.querySelectorAll('[data-staff]').forEach(r => { if (r._lazy) { r._lazy = false; renderStaff(r); } });
      if (focus) b.focus();
    };
    buttons.forEach(b => b.addEventListener('click', () => select(b)));
    tabs._select = name => { const b = buttons.find(x => x.dataset.tab === name); if (b) select(b); };
    requestAnimationFrame(() => place(buttons.find(b => b.classList.contains('on')) || buttons[0]));
    window.addEventListener('resize', () => place(buttons.find(b => b.classList.contains('on')) || buttons[0]));
  });
  if (location.hash === '#retired') {
    const tabs = document.querySelector('.tabs');
    if (tabs && tabs._select) tabs._select('panel-retired');
    const team = document.getElementById('team');
    if (team) setTimeout(() => team.scrollIntoView(), 50);
  }
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
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
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
  const catHost = document.getElementById('cmd-cats');
  host.replaceChildren(skeleton(4));
  let cats;
  try { cats = await loadJSON('commands.json'); }
  catch (e) { host.replaceChildren(el('p', { class: 'empty', text: 'The command list could not be loaded right now.' })); return; }
  host.replaceChildren();

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
    if (catHost) {
      const b = el('button', { type: 'button', text: cat.name });
      b.addEventListener('click', () => wrap.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }));
      catHost.appendChild(b);
    }
  });

  let intents = [];
  try {
    const raw = await loadJSON('intents.json');
    intents = raw.map(i => ({
      rows: allRows.filter(r => i.commands.some(c => r._cmd === c || r._cmd.startsWith(c + ' '))),
      phrases: i.phrases.map(intentWords)
    }));
  } catch (e) {}

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
    permSel.replaceChildren();
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
    if (catHost) catHost.style.display = (words.length || perm) ? 'none' : '';
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
  initSpotlight();
  initTabs();
  initHome();
  initCompare();
  initStatus();
  initStaff();
  initCommands();
  initDocs();
  initChangelog();
  initFaq();
  initMarquee();
  initCounters();
  reveal(document);
  if (!document.getElementById('doc-root')) initSideSpy();
});
