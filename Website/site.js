const ROOT = '../';
const DATA = '../Data/';

const NEXUS = {
  invite:  'https://discord.com/oauth2/authorize?client_id=1516923666787602725&permissions=8&integration_type=0&scope=bot',
  support: 'https://discord.gg/grVrz6TrsY',
  topgg:   'https://top.gg/bot/1516923666787602725',
  api:     'https://nexus-bot.wispbyte.org'
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

async function loadAPI(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(NEXUS.api + path, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) throw new Error('Nexus answered with ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function safeColor(c, fallback) {
  return (typeof c === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.trim())) ? c.trim() : (fallback || '#5865F2');
}

function safeLink(url) {
  return typeof url === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(url.trim()) ? url.trim() : null;
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

function fmtUptime(ms) {
  const mins = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  if (d > 0) return d + 'd ' + h + 'h';
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm';
}

function fmtMinutes(m) {
  if (m < 60) return m + (m === 1 ? ' minute' : ' minutes');
  const h = Math.floor(m / 60), r = m % 60;
  return h + (h === 1 ? ' hour' : ' hours') + (r ? ' ' + r + ' min' : '');
}

function skeleton(n) {
  const s = el('div', { class: 'skeleton', 'aria-label': 'Loading' });
  for (let i = 0; i < (n || 3); i++) s.appendChild(el('i'));
  return s;
}

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/></svg>',
  about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5h.01"/></svg>',
  docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/></svg>',
  community: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/></svg>',
  ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',
  dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="9" rx="2"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="2"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2"/><rect x="3" y="15" width="7.5" height="6" rx="2"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  caret: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>'
};

function svgIcon(name, cls) {
  const s = el('span', { 'aria-hidden': 'true', class: 'svg-i' + (cls ? ' ' + cls : '') });
  s.innerHTML = ICONS[name];
  return s;
}

const NAV = [
  { id: 'info', label: 'Information', icon: 'about', items: [
    ['about', 'about.html', 'About Nexus', 'What it is, why it exists, and the FAQ.'],
    ['status', 'status.html', 'Status', 'Is Nexus up right now, and how every day went.'],
    ['changelog', 'changelog.html', 'Changelog', 'What changed, and when.'],
    ['tools', 'tools.html', 'Tools', 'What Nexus is built with, and why.'],
    ['features', 'features.html', 'Features', 'Everything Nexus does, with examples.']
  ] },
  { id: 'docs', label: 'Docs', icon: 'docs', items: [
    ['docs', 'docs.html', 'Documentation', 'Guides for every feature, step by step.'],
    ['', 'docs.html#/getting-started', 'Getting started', 'Your first five minutes with Nexus.'],
    ['', 'docs.html#/troubleshooting', 'Troubleshooting', 'Fixes for the usual problems.'],
    ['', 'docs.html#/commands', 'Command list', 'Every command, searchable.'],
    ['', 'docs.html#/privacy', 'Privacy', 'What Nexus keeps, and what it never does.']
  ] },
  { id: 'community', label: 'Community', icon: 'community', items: [
    ['staff', 'staff.html', 'Staff team', 'The people behind the bot.'],
    ['support', 'support.html', 'Support', 'Quick fixes, and where to get help.'],
    ['projects', 'projects.html', 'Projects', 'What has launched and what is coming.']
  ] },
  { id: 'premium', label: 'Premium', icon: 'star', items: [
    ['premium', 'premium.html', 'Premium Plans', 'Coming soon.'],
    ['custombots', 'custombots.html', 'Custom Bots', 'Coming soon.']
  ] }
];

const LINKS = [
  ['listings', 'Listing Sites', 'Find, vote for and review Nexus', 'star'],
  ['support', 'Support server', 'Ask questions, report bugs', 'chat'],
  ['invite', 'Add Nexus', 'Invite it to your server', 'plus']
];

const LISTING_SITES = [
  { name: 'Top.gg', url: 'https://top.gg/bot/1516923666787602725', mark: 'T', color: '#ff3366',
    desc: 'The biggest Discord bot list. Vote every 12 hours and leave a review to help Nexus climb the rankings.' },
  { name: 'Discord Bot List', url: 'https://discordbotlist.com/bots/nexus-3519', mark: 'D', color: '#5865F2',
    desc: 'A popular list with votes and reviews. Upvotes here help new servers discover Nexus.' },
  { name: 'Discord Bots', url: 'https://discord.bots.gg/bots/1516923666787602725', mark: 'B', color: '#22c55e',
    desc: 'A long-running, clean bot directory with Nexus\'s description and stats.' }
];

let listingsModal = null;
function openListings() {
  closeAllMenus();
  if (listingsModal) { listingsModal.open(); return; }
  const lastFocus = { el: null };
  const close = el('button', { class: 'modal-x', type: 'button', 'aria-label': 'Close', text: '×' });
  const box = el('div', { class: 'modal-box', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'listings-title' }, [
    close,
    el('p', { class: 'eyebrow', text: 'Listing sites' }),
    el('h2', { id: 'listings-title', text: 'Find Nexus on bot lists' }),
    el('p', { class: 'modal-lead', text: 'Nexus is listed on these sites. Voting and leaving a review takes a few seconds and helps other servers find it. Thank you!' }),
    el('div', { class: 'listing-grid' }, LISTING_SITES.map((s, i) => el('a', { class: 'listing', href: s.url, target: '_blank', rel: 'noopener', style: '--lc:' + s.color + ';--i:' + i }, [
      el('span', { class: 'listing-mark', 'aria-hidden': 'true', text: s.mark }),
      el('span', { class: 'listing-text' }, [el('b', {}, [s.name, el('span', { class: 'listing-arrow', 'aria-hidden': 'true', text: ' ↗' })]), el('small', { text: s.desc })])
    ])))
  ]);
  const overlay = el('div', { class: 'modal', hidden: '' }, [box]);
  function hide() {
    overlay.classList.remove('show');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { overlay.hidden = true; }, REDUCED ? 0 : 220);
    if (lastFocus.el && lastFocus.el.focus) lastFocus.el.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') hide();
    if (e.key === 'Tab') {
      const items = Array.from(box.querySelectorAll('a, button'));
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  close.addEventListener('click', hide);
  overlay.addEventListener('click', e => { if (e.target === overlay) hide(); });
  document.body.appendChild(overlay);
  listingsModal = {
    open() {
      lastFocus.el = document.activeElement;
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add('show'));
      document.addEventListener('keydown', onKey);
      close.focus();
    }
  };
  listingsModal.open();
}

function groupOf(page) {
  const g = NAV.find(group => group.items.some(i => i[0] && i[0] === page));
  return g ? g.id : '';
}

function closeAllMenus(except) {
  document.querySelectorAll('.dd.open').forEach(d => {
    if (d !== except) {
      d.classList.remove('open');
      const b = d.querySelector('.dd-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
  });
}

function dropdown(label, items, opts) {
  const wrap = el('div', { class: 'dd' + (opts.cls ? ' ' + opts.cls : '') });
  const btn = el('button', { class: 'dd-btn' + (opts.active ? ' active' : ''), type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false' });
  if (opts.icon) btn.appendChild(svgIcon(opts.icon));
  if (label) btn.appendChild(el('span', { class: 'dd-label', text: label }));
  if (opts.ariaLabel) btn.setAttribute('aria-label', opts.ariaLabel);
  if (opts.caret !== false) btn.appendChild(svgIcon('caret', 'caret'));
  const menu = el('div', { class: 'dd-menu', role: 'menu' });
  items.forEach((it, i) => {
    const a = el('a', { href: it.href, role: 'menuitem', class: it.active ? 'active' : '', style: '--i:' + i });
    if (it.icon) a.appendChild(svgIcon(it.icon, 'dd-ico'));
    a.appendChild(el('span', {}, [el('b', { text: it.label }), el('small', { text: it.desc })]));
    if (it.external) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
    if (it.onClick) a.addEventListener('click', e => { e.preventDefault(); it.onClick(); });
    menu.appendChild(a);
  });
  const set = open => {
    if (open) closeAllMenus(wrap);
    wrap.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  btn.addEventListener('click', e => { e.stopPropagation(); set(!wrap.classList.contains('open')); });
  let hoverTimer = null;
  const fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    wrap.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); set(true); });
    wrap.addEventListener('mouseleave', () => { hoverTimer = setTimeout(() => set(false), 160); });
  }
  menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  wrap.appendChild(btn);
  wrap.appendChild(menu);
  return wrap;
}

function buildChrome() {
  const page = document.body.dataset.page || '';
  const activeGroup = groupOf(page);

  const navHost = document.getElementById('site-nav');
  if (navHost) {
    const nav = el('nav', { class: 'site-nav', 'aria-label': 'Main' });
    const brand = el('a', { class: 'nav-brand', href: 'index.html', 'aria-label': 'Nexus home' }, [
      el('img', { src: ROOT + 'Assets/Logo/logo.png', alt: '', width: '30', height: '30' }), el('span', { text: 'Nexus' })
    ]);
    const list = el('div', { class: 'nav-links' });
    NAV.forEach(group => {
      list.appendChild(dropdown(group.label, group.items.map(([id, href, label, desc]) => ({
        href, label, desc, active: id && id === page
      })), { active: group.id === activeGroup }));
    });

    const cta = el('a', { class: 'nav-cta' + (page === 'dashboard' ? ' active' : ''), href: 'dashboard.html' }, [svgIcon('dash'), el('span', { class: 'lbl', text: 'Dashboard' })]);
    const linkMenu = dropdown('', LINKS.map(([key, label, desc, icon]) => key === 'listings'
      ? { href: '#listing-sites', label, desc, icon, onClick: openListings }
      : { href: NEXUS[key], label, desc, icon, external: true }
    ), { icon: 'link', caret: false, cls: 'dd-links', ariaLabel: 'Quick links' });
    linkMenu.querySelector('.dd-btn').classList.add('icon-btn');

    nav.appendChild(brand);
    nav.appendChild(list);
    nav.appendChild(el('div', { class: 'nav-actions' }, [cta, linkMenu]));
    navHost.replaceWith(nav);

    const dock = el('nav', { class: 'dock', 'aria-label': 'Quick navigation' });
    const sheet = el('div', { class: 'dock-sheet', role: 'menu' });
    dock.appendChild(el('a', { href: 'index.html', class: page === 'home' ? 'active' : '' }, [svgIcon('home'), el('span', { text: 'Home' })]));
    NAV.forEach(group => {
      const b = el('button', { type: 'button', class: group.id === activeGroup ? 'active' : '', 'aria-expanded': 'false' }, [svgIcon(group.icon), el('span', { text: group.id === 'info' ? 'Info' : group.label })]);
      b.addEventListener('click', e => {
        e.stopPropagation();
        const open = sheet.dataset.group === group.id && sheet.classList.contains('open');
        dock.querySelectorAll('button').forEach(x => x.setAttribute('aria-expanded', 'false'));
        if (open) { sheet.classList.remove('open'); return; }
        sheet.replaceChildren(el('h6', { text: group.label }));
        group.items.forEach(([id, href, label, desc], i) => sheet.appendChild(el('a', { href, class: id && id === page ? 'active' : '', style: '--i:' + i }, [el('b', { text: label }), el('small', { text: desc })])));
        sheet.dataset.group = group.id;
        sheet.classList.add('open');
        b.setAttribute('aria-expanded', 'true');
      });
      dock.appendChild(b);
    });
    document.body.appendChild(sheet);
    document.body.appendChild(dock);

    document.addEventListener('click', e => {
      if (!e.target.closest('.dd')) closeAllMenus();
      if (!e.target.closest('.dock-sheet, .dock')) {
        sheet.classList.remove('open');
        dock.querySelectorAll('button').forEach(x => x.setAttribute('aria-expanded', 'false'));
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeAllMenus(); sheet.classList.remove('open'); }
    });

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
      el('div', { class: 'footer-grid footer-grid-5' }, [
        el('div', {}, [
          el('div', { class: 'footer-brand' }, [el('img', { src: ROOT + 'Assets/Logo/logo.png', alt: '' }), 'Nexus']),
          el('p', { class: 'footer-note', text: 'Built on logic, built for everyone.' })
        ]),
        col('Information', [['about.html', 'About Nexus'], ['status.html', 'Status'], ['changelog.html', 'Changelog'], ['tools.html', 'Tools'], ['features.html', 'Features']]),
        col('Docs', [['docs.html', 'Documentation'], ['docs.html#/getting-started', 'Getting started'], ['docs.html#/troubleshooting', 'Troubleshooting'], ['docs.html#/commands', 'Command list'], ['docs.html#/privacy', 'Privacy']]),
        col('Community', [['staff.html', 'Staff team'], ['support.html', 'Support'], ['projects.html', 'Projects']]),
        col('Premium', [['premium.html', 'Premium Plans'], ['custombots.html', 'Custom Bots']])
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

const REVEAL_SELECTOR = '.section-head, .tile, .card, .member, .component, .incident, .tl-item, details.faq, .cmp-scroll, .cmp-verdict, .cta-band, .quote, .marquee, .staff-section > h2, .reveal-me, .project, .app-card, .cal-wrap, .feat-row, .soon, .feature, .feature-foot';
let revealObserver = null;

function reveal(scope) {
  const nodes = Array.from((scope || document).querySelectorAll(REVEAL_SELECTOR))
    .filter(n => !n.closest('.doc-page, #dash-root, .dd-menu') && !n.classList.contains('reveal'));
  if (scope && scope.matches && scope.matches(REVEAL_SELECTOR) && !scope.classList.contains('reveal')) nodes.unshift(scope);
  if (!nodes.length) return;
  const counts = new Map();
  nodes.forEach(n => {
    const parent = n.parentElement;
    const k = counts.get(parent) || 0;
    counts.set(parent, k + 1);
    n.style.setProperty('--d', Math.min(k, 8) * 70 + 'ms');
    n.classList.add('reveal');
    if (n.matches('.tile, .card, .member, .component, .project, .app-card')) n.classList.add('spot');
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

function animateNumber(node, to) {
  const from = typeof node._val === 'number' ? node._val : 0;
  node._val = to;
  const fmt = v => Math.round(v).toLocaleString();
  if (REDUCED || from === to) { node.textContent = fmt(to); return; }
  const start = performance.now();
  const dur = from === 0 ? 1400 : 700;
  const token = (node._anim = (node._anim || 0) + 1);
  const step = now => {
    if (node._anim !== token) return;
    const p = Math.min(1, (now - start) / dur);
    node.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  setTimeout(() => { if (node._anim === token) { node._anim++; node.textContent = fmt(to); } }, dur + 150);
  if (from !== 0) { node.classList.remove('bump'); void node.offsetWidth; node.classList.add('bump'); }
}

function memberCount(n) {
  return n.toLocaleString('en-US') + (n === 1 ? ' member' : ' members');
}

function serverChip(s) {
  const icon = typeof s.icon === 'string' && s.icon.indexOf('https://cdn.discordapp.com/') === 0 ? s.icon : null;
  const name = String(s.name || 'Server');
  const mark = icon
    ? el('img', { class: 'gi', src: icon, alt: '', width: '34', height: '34', loading: 'lazy', referrerpolicy: 'no-referrer' })
    : el('span', { class: 'gi', text: name.charAt(0).toUpperCase() });
  return el('span', { class: 'chip-card' }, [mark, el('span', {}, [el('b', { text: name }), el('small', { text: memberCount(Number(s.members) || 0) })])]);
}

async function initMarquee() {
  const belt = document.getElementById('belt');
  const track = document.getElementById('belt-track');
  if (!belt || !track) return;
  let servers = [];
  try { servers = (await loadAPI('/public/servers')).servers || []; } catch (e) {}
  servers = servers.filter(s => s && typeof s === 'object').slice(0, 12);
  if (servers.length < 3) return;
  const chips = servers.map(serverChip);
  while (chips.length < 8) servers.forEach(s => chips.push(serverChip(s)));
  chips.forEach(c => track.appendChild(c));
  Array.from(track.children).forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); track.appendChild(k); });
  belt.hidden = false;
}

function initFeatures() {
  const bar = document.getElementById('ftabs');
  if (!bar) return;
  const tabs = Array.from(bar.querySelectorAll('a.ftab'));
  const pairs = tabs.map(a => [a, document.getElementById((a.getAttribute('href') || '').slice(1))]).filter(p => p[1]);
  if (!pairs.length) return;

  let activeId = '';
  let lockUntil = 0;

  function mark(id) {
    if (id === activeId) return;
    activeId = id;
    pairs.forEach(([a, s]) => {
      const on = s.id === id;
      a.classList.toggle('on', on);
      if (on) {
        a.setAttribute('aria-current', 'true');
        const left = a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2;
        if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: Math.max(0, left), behavior: REDUCED ? 'auto' : 'smooth' });
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  function edges() {
    bar.classList.toggle('more-r', bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 4);
    bar.classList.toggle('more-l', bar.scrollLeft > 4);
  }
  bar.addEventListener('scroll', edges, { passive: true });
  window.addEventListener('resize', edges);
  edges();

  pairs.forEach(([a, s]) => {
    a.addEventListener('click', e => {
      e.preventDefault();
      lockUntil = Date.now() + 1100;
      s.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', '#' + s.id); } catch (err) {}
      mark(s.id);
      setTimeout(spy, 1150);
    });
  });

  let queued = false;
  function spy() {
    queued = false;
    if (Date.now() < lockUntil) return;
    const line = window.innerHeight * 0.38;
    let current = pairs[0][1];
    pairs.forEach(p => { if (p[1].getBoundingClientRect().top <= line) current = p[1]; });
    mark(current.id);
  }
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(spy);
  }, { passive: true });

  const start = decodeURIComponent((location.hash || '').slice(1));
  const first = pairs.find(p => p[1].id === start) || pairs[0];
  mark(first[1].id);
  if (start && first[1].id === start) setTimeout(() => first[1].scrollIntoView({ block: 'start' }), 60);
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
  outage: 'Nexus is not responding right now'
};
function normState(s) { return STATE_RANK.hasOwnProperty(s) ? s : 'operational'; }
function worst(states) {
  return states.reduce((w, s) => STATE_RANK[s] > STATE_RANK[w] ? s : w, 'operational');
}

function isIncidentActive(i) {
  if (!i || i.status === 'resolved') return false;
  const last = String(i.ends || i.date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(last)) return true;
  const n = new Date();
  const today = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
  return last >= today;
}

const Live = {
  stats: null,
  error: null,
  incidents: [],
  listeners: [],
  timer: null,
  subscribe(fn) { this.listeners.push(fn); if (this.stats || this.error) fn(this); },
  emit() { this.listeners.forEach(fn => { try { fn(this); } catch (e) {} }); },
  async refresh() {
    try { this.stats = await loadAPI('/public/stats'); this.error = null; }
    catch (e) { this.error = e; }
    this.emit();
  },
  async start() {
    try {
      const data = await loadJSON('status.json');
      this.incidents = (data.incidents || []).filter(isIncidentActive);
    } catch (e) {}
    await this.refresh();
    const tick = () => { if (!document.hidden) this.refresh(); };
    this.timer = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.refresh(); });
  },
  state() {
    if (this.error || !this.stats) return this.error ? 'outage' : 'operational';
    const base = this.stats.online ? 'operational' : 'degraded';
    const extra = this.incidents.map(i => i.status === 'maintenance' ? 'maintenance' : 'degraded');
    return worst([base].concat(extra));
  }
};

function statPill(label) {
  const b = el('b', { text: '–' });
  const span = el('span', { text: label });
  const pill = el('div', { class: 'stat-pill rise' }, [b, span]);
  pill.value = b;
  pill.label = span;
  return pill;
}

async function initHomeStats() {
  const host = document.getElementById('home-stats');
  if (!host) return;
  const servers = statPill('servers');
  const users = statPill('users');
  const cmds = statPill('commands');
  const up = statPill('uptime, last 30 days');
  const live = el('span', { class: 'live-tag', title: 'Numbers come straight from the bot and update every 30 seconds' }, [el('i'), 'LIVE']);
  [servers, users, cmds, up].forEach((p, i) => { p.style.setProperty('--d', 350 + i * 90 + 'ms'); host.appendChild(p); });
  host.appendChild(live);
  host.style.display = 'flex';

  try {
    const cats = await loadJSON('commands.json');
    animateNumber(cmds.value, cats.reduce((n, c) => n + (c.commands || []).length, 0));
  } catch (e) { cmds.remove(); }

  let fallbackDone = false;
  Live.subscribe(async liveData => {
    const s = liveData.stats;
    if (s && !liveData.error) {
      animateNumber(servers.value, s.servers);
      servers.label.textContent = s.servers === 1 ? 'server' : 'servers';
      animateNumber(users.value, s.users);
      users.label.textContent = s.users === 1 ? 'user' : 'users';
      up.hidden = typeof s.uptime_30d !== 'number';
      if (!up.hidden) up.value.textContent = s.uptime_30d + '%';
      users.hidden = false;
      live.classList.remove('off');
      live.lastChild.textContent = 'LIVE';
    } else {
      live.classList.add('off');
      live.lastChild.textContent = 'OFFLINE';
      up.hidden = true;
      if (!fallbackDone) {
        fallbackDone = true;
        try {
          const st = await loadJSON('stats.json');
          if (Number(st.servers) > 0 && !servers.value._val) animateNumber(servers.value, Number(st.servers));
        } catch (e) {}
      }
      if (!users.value._val) users.hidden = true;
    }
  });
}

function initStatusPill() {
  const host = document.getElementById('status-pill');
  if (!host) return;
  Live.subscribe(live => {
    const s = live.state();
    host.className = 'status-pill rise';
    host.replaceChildren(el('span', { class: 'dot ' + s }), document.createTextNode(OVERALL_TEXT[s]));
    host.style.display = 'inline-flex';
  });
}

function initLiveNumbers() {
  const nodes = document.querySelectorAll('[data-live]');
  if (!nodes.length) return;
  Live.subscribe(live => {
    nodes.forEach(n => {
      const key = n.dataset.live;
      if (live.stats && typeof live.stats[key] === 'number') animateNumber(n, live.stats[key]);
    });
  });
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
    if (b.logo) logo.appendChild(el('img', { src: ROOT + 'Assets/Logo/' + b.logo, alt: '' }));
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

function renderIncident(i) {
  const live = i.status !== 'resolved';
  const box = el('div', { class: 'incident ' + (live ? 'live' : 'done') });
  box.appendChild(el('div', { class: 'incident-head' }, [
    el('h3', { text: i.title || 'Incident' }),
    el('span', { class: 'tag ' + (i.status || ''), text: i.status || 'update' })
  ]));
  if (i.date) box.appendChild(el('div', { class: 'date', text: fmtDate(i.date) }));
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

function dayLevel(d) {
  if (!d || !d.tracked) return 'none';
  if (d.down <= 0) return 'green';
  if (d.down <= 30) return 'yellow';
  if (d.down <= 240) return 'orange';
  return 'red';
}

const LEVEL_TEXT = {
  green: 'Online all day',
  yellow: 'Down for 30 minutes or less',
  orange: 'Down for 30 minutes to 4 hours',
  red: 'Down for more than 4 hours',
  none: 'Not tracked yet'
};

function utcKey(y, m, d) {
  return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

async function initStatus() {
  const root = document.getElementById('status-root');
  if (!root) return;
  const head = document.getElementById('status-headline');
  const dot = document.getElementById('status-dot');
  const meta = document.getElementById('status-meta');
  const comps = el('div', { class: 'components' });
  const calHost = document.getElementById('status-calendar');
  const incHost = document.getElementById('status-incidents');
  root.replaceChildren(comps);
  comps.appendChild(skeleton(1));

  let incidents = [];
  try { incidents = ((await loadJSON('status.json')).incidents || []).filter(Boolean); } catch (e) {}
  const notes = {};
  incidents.forEach(i => {
    const key = String(i.date || '').slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) (notes[key] = notes[key] || []).push(i);
  });

  const active = incidents.filter(isIncidentActive);
  if (incHost) {
    incHost.replaceChildren();
    if (active.length) active.forEach(i => incHost.appendChild(renderIncident(i)));
    else incHost.appendChild(el('div', { class: 'incident done' }, [el('div', { class: 'incident-head' }, [el('h3', { text: 'Nothing going on' }), el('span', { class: 'tag resolved', text: 'all clear' })]), el('p', { text: 'There are no open incidents right now.' })]));
  }

  let days = {};
  let calendar = null;

  function component(name, state, note) {
    return el('div', { class: 'component' }, [
      el('div', { class: 'top' }, [
        el('div', { class: 'name', text: name }),
        el('span', { class: 'state ' + state }, [el('span', { class: 'dot ' + state }), STATE_LABEL[state]])
      ]),
      el('div', { class: 'note', text: note })
    ]);
  }

  function paint(data, error) {
    const botState = error ? 'outage' : (data.online ? 'operational' : 'degraded');
    const extra = active.map(i => i.status === 'maintenance' ? 'maintenance' : 'degraded');
    const overall = worst([botState].concat(extra));
    if (head) head.textContent = OVERALL_TEXT[overall];
    if (dot) dot.className = 'dot ' + overall;

    comps.replaceChildren(
      component('Discord bot', botState, error ? 'Not responding. The team is notified when Nexus goes quiet.' : (data.online ? 'Online and responding' + (data.latency_ms ? ' in ' + data.latency_ms + ' ms' : '') : 'Reconnecting to Discord')),
      component('Dashboard', error ? 'outage' : 'operational', error ? 'Could not be reached' : 'Reachable, logins and settings work')
    );
    reveal(comps);

    if (meta) {
      meta.replaceChildren();
      if (!error) {
        meta.appendChild(el('span', { text: 'ONLINE FOR ' + fmtUptime((data.now - data.online_since) * 1000).toUpperCase() }));
        const recent = Object.values(days).filter(d => d.tracked).slice(-30);
        const exp = recent.reduce((n, d) => n + d.expected, 0);
        const down = recent.reduce((n, d) => n + d.down, 0);
        if (exp > 0) meta.appendChild(el('span', { text: (Math.floor((1 - down / exp) * 10000) / 100) + '% UPTIME, LAST 30 DAYS' }));
      } else {
        meta.appendChild(el('span', { text: 'CAN\'T REACH NEXUS' }));
      }
      meta.appendChild(el('span', { class: 'live-tag' + (error ? ' off' : ''), text: '' }, [el('i'), error ? 'OFFLINE' : 'LIVE']));
    }
  }

  async function load() {
    try {
      const data = await loadAPI('/public/status');
      days = {};
      (data.days || []).forEach(d => { days[d.date] = d; });
      paint(data, null);
      if (calendar) calendar.update(days, false); else calendar = buildCalendar(calHost, days, notes, false);
    } catch (e) {
      paint(null, e);
      if (calendar) calendar.update(days, true); else calendar = buildCalendar(calHost, days, notes, true);
    }
  }
  await load();
  setInterval(() => { if (!document.hidden) load(); }, 60000);
}

function buildCalendar(host, days, notes, offline) {
  if (!host) return null;
  const now = new Date();
  const todayKey = utcKey(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let view = { y: now.getUTCFullYear(), m: now.getUTCMonth() };
  let selected = todayKey;

  function earliestMonth() {
    const keys = Object.keys(days).filter(k => days[k].tracked).concat(Object.keys(notes)).sort();
    if (!keys.length) return { y: view.y, m: view.m };
    const [y, m] = keys[0].split('-').map(Number);
    return { y, m: m - 1 };
  }

  const title = el('h3', { class: 'cal-title' });
  const prev = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Previous month' }, [svgIcon('left')]);
  const next = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Next month' }, [svgIcon('right')]);
  const grid = el('div', { class: 'cal-grid', role: 'grid' });
  const detail = el('div', { class: 'cal-detail', 'aria-live': 'polite' });
  const warn = el('div', { class: 'callout warn', hidden: '' }, [el('strong', { text: 'Uptime history is unavailable. ' }), 'Nexus could not be reached, so only the notes the team wrote are shown.']);
  const legend = el('div', { class: 'cal-legend' });
  ['green', 'yellow', 'orange', 'red', 'none'].forEach(l => legend.appendChild(el('span', {}, [el('i', { class: 'lvl-' + l }), LEVEL_TEXT[l]])));

  host.replaceChildren(el('div', { class: 'cal-wrap' }, [
    el('div', { class: 'cal-main' }, [
      el('div', { class: 'cal-head' }, [prev, title, next]),
      el('div', { class: 'cal-week' }, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => el('span', { text: d }))),
      grid,
      legend
    ]),
    detail
  ]));
  host.prepend(warn);

  function showDetail(key) {
    selected = key;
    grid.querySelectorAll('.cal-day').forEach(b => b.classList.toggle('sel', b.dataset.key === key));
    const d = days[key];
    const lvl = dayLevel(d);
    const [y, m, dd] = key.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, dd));
    detail.replaceChildren(
      el('div', { class: 'cal-detail-date', text: date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) + (key === todayKey ? ' (today)' : '') }),
      el('div', { class: 'cal-detail-state' }, [el('i', { class: 'lvl-' + lvl }), el('b', { text: lvl === 'green' ? (key === todayKey ? 'Online all day so far' : 'Online all day') : lvl === 'none' ? 'Not tracked' : 'Down for about ' + fmtMinutes(d.down) })])
    );
    if (lvl === 'none') detail.appendChild(el('p', { class: 'hint', text: offline ? 'Nexus could not be reached, so this day\'s uptime can\'t be shown right now.' : 'Uptime tracking had not started yet on this day.' }));
    const list = notes[key] || [];
    if (list.length) list.forEach(i => detail.appendChild(renderIncident(i)));
    else if (lvl !== 'green' && lvl !== 'none') detail.appendChild(el('p', { class: 'hint', text: 'No explanation has been written for this day yet.' }));
    else detail.appendChild(el('p', { class: 'hint', text: 'Nothing was reported on this day.' }));
  }

  function render() {
    const first = earliestMonth();
    const cur = { y: now.getUTCFullYear(), m: now.getUTCMonth() };
    prev.disabled = view.y * 12 + view.m <= first.y * 12 + first.m;
    next.disabled = view.y * 12 + view.m >= cur.y * 12 + cur.m;
    title.textContent = new Date(Date.UTC(view.y, view.m, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
    grid.replaceChildren();
    const lead = (new Date(Date.UTC(view.y, view.m, 1)).getUTCDay() + 6) % 7;
    for (let i = 0; i < lead; i++) grid.appendChild(el('span', { class: 'cal-blank' }));
    const count = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    for (let d = 1; d <= count; d++) {
      const key = utcKey(view.y, view.m, d);
      const future = key > todayKey;
      const lvl = future ? 'future' : dayLevel(days[key]);
      const b = el('button', { type: 'button', class: 'cal-day lvl-' + lvl + (key === todayKey ? ' today' : '') + (key === selected ? ' sel' : ''), 'data-key': key, style: '--i:' + (lead + d) }, [el('span', { text: String(d) })]);
      if (notes[key]) b.appendChild(el('i', { class: 'cal-note', 'aria-hidden': 'true' }));
      b.setAttribute('aria-label', key + ': ' + (future ? 'upcoming' : LEVEL_TEXT[lvl]) + (notes[key] ? ', has a note' : ''));
      if (future) b.disabled = true;
      else b.addEventListener('click', () => showDetail(key));
      grid.appendChild(b);
    }
  }

  prev.addEventListener('click', () => { view.m--; if (view.m < 0) { view.m = 11; view.y--; } render(); });
  next.addEventListener('click', () => { view.m++; if (view.m > 11) { view.m = 0; view.y++; } render(); });

  render();
  showDetail(selected);
  warn.hidden = !offline;
  return {
    update(newDays, isOffline) {
      days = newDays;
      offline = isOffline;
      warn.hidden = !offline;
      render();
      showDetail(selected);
    }
  };
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

  async function include(page) {
    const host = page.querySelector('[data-include]');
    if (!host || host.dataset.loaded) return;
    host.dataset.loaded = '1';
    try {
      const res = await fetch(host.dataset.include, { cache: 'no-cache' });
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const main = doc.querySelector('main');
      if (!main) throw new Error('missing');
      main.querySelectorAll('script').forEach(s => s.remove());
      const slug = page.dataset.doc;
      main.querySelectorAll('[id]').forEach(n => { n.id = slug + '-' + n.id; });
      main.querySelectorAll('a[href^="#"]').forEach(a => { a.setAttribute('href', '#/' + slug + '/' + a.getAttribute('href').slice(1)); });
      host.replaceChildren(...Array.from(main.childNodes).map(n => document.importNode(n, true)));
      host.classList.add('prose');
      index[slug] += ' ' + host.textContent.toLowerCase();
      reveal(host);
    } catch (e) {
      host.replaceChildren(el('p', {}, ['This could not be loaded. Open the ', el('a', { class: 'inline', href: host.dataset.include, text: 'full page' }), ' instead.']));
    }
  }

  function show(slug, anchor) {
    if (!byId[slug]) slug = 'overview';
    include(byId[slug]);
    pages.forEach(p => p.classList.toggle('active', p.dataset.doc === slug));
    links.forEach(a => a.classList.toggle('active', a.dataset.doc === slug));
    const activeLink = links.find(a => a.dataset.doc === slug);
    if (activeLink && side.scrollHeight > side.clientHeight) {
      side.scrollTo({ top: Math.max(0, activeLink.offsetTop - side.clientHeight / 2), behavior: REDUCED ? 'auto' : 'smooth' });
    }
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
  const limit = Number(root.dataset.limit) || 0;
  root.replaceChildren(skeleton(3));
  let entries;
  try { entries = await loadJSON('changelog.json'); }
  catch (e) { root.replaceChildren(el('p', { class: 'empty', text: 'The changelog could not be loaded right now. Try again in a minute.' })); return; }

  root.replaceChildren();
  if (!Array.isArray(entries) || !entries.length) {
    root.appendChild(el('p', { class: 'empty', text: 'Nothing here yet.' }));
    return;
  }
  const stamp = e => { const t = new Date(String(e.date || '') + (/^\d{4}-\d{2}-\d{2}$/.test(e.date) ? 'T00:00:00' : '')).getTime(); return isNaN(t) ? 0 : t; };
  const sorted = entries.slice().sort((a, b) => stamp(b) - stamp(a));
  const cutoff = Date.now() - 90 * 86400000;
  const recent = sorted.filter(e => stamp(e) >= cutoff);
  const older = sorted.filter(e => stamp(e) < cutoff);
  const line = el('div', { class: 'timeline' });
  (limit ? recent.slice(0, limit) : recent).forEach(e => line.appendChild(changelogCard(e)));
  if (line.children.length) root.appendChild(line);
  else root.appendChild(el('p', { class: 'empty', text: 'No updates in the last 90 days.' }));
  if (!limit && older.length) {
    const more = el('button', { class: 'btn btn-outline tl-more', type: 'button', text: 'View older updates' });
    more.addEventListener('click', () => {
      const olderLine = el('div', { class: 'timeline' });
      older.forEach(e => olderLine.appendChild(changelogCard(e)));
      more.replaceWith(olderLine);
      reveal(olderLine);
    });
    root.appendChild(more);
  }
  reveal(root);
}

const safeUrl = u => /^https:\/\/[^\s"'<>]+$/i.test(String(u || '')) ? String(u) : '';

async function initTools() {
  const root = document.getElementById('tools-root');
  if (!root) return;
  root.replaceChildren(skeleton(3));
  let data;
  try { data = await loadJSON('tools.json'); }
  catch (e) { root.replaceChildren(el('p', { class: 'empty', text: 'The tools list could not be loaded right now. Try again in a minute.' })); return; }

  const groups = [
    { title: 'Tools', intro: 'The programs and services Nexus runs on.', items: data && data.tools },
    { title: 'Libraries', intro: 'The code Nexus uses to do its work.', items: data && data.libraries }
  ];
  root.replaceChildren();
  groups.forEach(group => {
    const items = Array.isArray(group.items) ? group.items : [];
    if (!items.length) return;
    const section = el('section', { class: 'tool-group' });
    section.appendChild(el('h2', { class: 'faq-group', text: group.title }));
    section.appendChild(el('p', { class: 'tool-intro', text: group.intro }));
    const grid = el('div', { class: 'tool-grid' });
    items.forEach(item => {
      const card = el('div', { class: 'tool-card reveal-me' });
      const head = el('div', { class: 'tool-head' }, [el('h3', { text: item.name || 'Untitled' })]);
      const url = safeUrl(item.link);
      if (url) head.appendChild(el('a', { class: 'tool-link', href: url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Open ' + (item.name || 'link'), text: 'Open ↗' }));
      card.appendChild(head);
      if (item.what) card.appendChild(el('p', { class: 'tool-what', text: item.what }));
      if (item.why) card.appendChild(el('p', { class: 'tool-why' }, [el('b', { text: 'Why Nexus uses it: ' }), item.why]));
      grid.appendChild(card);
    });
    section.appendChild(grid);
    root.appendChild(section);
  });
  if (!root.children.length) root.appendChild(el('p', { class: 'empty', text: 'Nothing here yet.' }));
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
    if (group.title && !(root.dataset.heading && groups.length === 1)) root.appendChild(el(root.dataset.heading || 'h2', { class: 'faq-group', text: group.title }));
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

function initFilter() {
  document.querySelectorAll('[data-filter-for]').forEach(input => {
    const scope = document.getElementById(input.dataset.filterFor);
    if (!scope) return;
    const none = el('p', { class: 'empty', text: 'Nothing matches that. Try other words, or ask in the support server.', hidden: '' });
    scope.appendChild(none);
    input.addEventListener('input', () => {
      const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      scope.querySelectorAll('details.faq').forEach(d => {
        const ok = !terms.length || terms.every(t => d.textContent.toLowerCase().includes(t));
        d.hidden = !ok;
        if (ok) shown++;
      });
      scope.querySelectorAll('.faq-group').forEach(h => {
        let n = h.nextElementSibling, any = false;
        while (n && !n.classList.contains('faq-group')) { if (n.matches('details.faq') && !n.hidden) any = true; n = n.nextElementSibling; }
        h.hidden = !any;
      });
      none.hidden = shown > 0;
    });
  });
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p.charAt(0).toUpperCase()).join('') || '?';
}

const TEAM_GROUPS = [
  { key: 'staff', label: 'Staff', icon: '🛡️' },
  { key: 'helpers', label: 'Helpers', icon: '🤝' },
  { key: 'ambassadors', label: 'Ambassadors', icon: '📣' },
  { key: 'testers', label: 'Testers', icon: '🧪' },
  { key: 'council', label: 'Suggestion Council', icon: '💡' }
];

function teamGroups(data) {
  const out = {};
  TEAM_GROUPS.forEach(g => {
    const v = data && data[g.key];
    out[g.key] = Array.isArray(v) ? v : (v && Array.isArray(v.sections) ? v.sections : []);
  });
  if (data && Array.isArray(data.sections) && !out.staff.length) out.staff = data.sections;
  return out;
}

function segmented(items, current, onPick, opts) {
  const box = el('div', { class: 'tabs' + (opts && opts.cls ? ' ' + opts.cls : ''), role: 'tablist', 'aria-label': opts && opts.label || '' });
  const ind = el('span', { class: 'tab-ind', 'aria-hidden': 'true' });
  box.appendChild(ind);
  const buttons = items.map(it => {
    const b = el('button', { type: 'button', role: 'tab', 'aria-selected': it.key === current ? 'true' : 'false', class: it.key === current ? 'on' : '' },
      it.icon ? [el('span', { class: 'seg-ico', 'aria-hidden': 'true', text: it.icon }), it.label] : [it.label]);
    b.addEventListener('click', () => pick(it.key));
    box.appendChild(b);
    return b;
  });
  const place = () => {
    const b = buttons.find(x => x.classList.contains('on'));
    if (!b) return;
    ind.style.width = b.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + (b.offsetLeft - 5) + 'px)';
    if (box.scrollWidth > box.clientWidth) box.scrollLeft = Math.max(0, b.offsetLeft - (box.clientWidth - b.offsetWidth) / 2);
  };
  function pick(key) {
    buttons.forEach((b, i) => { const on = items[i].key === key; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    place();
    onPick(key);
  }
  requestAnimationFrame(place);
  window.addEventListener('resize', place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  return box;
}

async function initTeam() {
  const root = document.getElementById('team-root');
  if (!root) return;
  root.replaceChildren(skeleton(2));
  const [cur, old] = await Promise.all([
    loadJSON('staff.json').then(teamGroups).catch(() => null),
    loadJSON('retired.json').then(teamGroups).catch(() => null)
  ]);
  const files = { current: cur, former: old };
  const params = new URLSearchParams(location.hash.slice(1));
  const st = {
    group: TEAM_GROUPS.some(g => g.key === params.get('group')) ? params.get('group') : 'staff',
    era: params.get('era') === 'former' || location.hash === '#retired' ? 'former' : 'current'
  };
  const body = el('div', { class: 'team-body' });
  const note = el('p', { class: 'team-note' });

  function draw() {
    try { history.replaceState(null, '', '#group=' + st.group + '&era=' + st.era); } catch (e) {}
    const data = files[st.era];
    const label = TEAM_GROUPS.find(g => g.key === st.group).label;
    note.textContent = st.era === 'former' ? 'Thank you to everyone who helped build and look after Nexus.' : '';
    note.hidden = st.era !== 'former';
    const view = el('div', { class: 'team-view' });
    if (!data) view.appendChild(el('p', { class: 'empty', text: 'This list could not be loaded right now. Try again in a minute.' }));
    else {
      const sections = data[st.group] || [];
      const people = sections.reduce((n, s) => n + ((s && s.members) || []).length, 0);
      if (!people) view.appendChild(el('p', { class: 'staff-empty team-empty', text: st.era === 'former' ? 'No former ' + label.toLowerCase() + ' yet.' : 'No ' + label.toLowerCase() + ' right now.' }));
      else renderStaffSections(view, sections);
    }
    body.replaceChildren(view);
    reveal(view);
  }

  const controls = el('div', { class: 'team-controls' }, [
    segmented(TEAM_GROUPS, st.group, k => { st.group = k; draw(); }, { label: 'Team', cls: 'team-groups' }),
    segmented([{ key: 'current', label: 'Current' }, { key: 'former', label: 'Former' }], st.era, k => { st.era = k; draw(); }, { label: 'Current or former', cls: 'team-era' })
  ]);
  root.replaceChildren(controls, note, body);
  draw();
}

function renderStaffSections(root, sections) {
  (sections || []).forEach(sec => {
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
        const avatarSrc = m.avatar && !/^https?:/.test(m.avatar) ? ROOT + 'Assets/Avatars/' + m.avatar : m.avatar;
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

async function renderStaff(root) {
  root.replaceChildren(skeleton(2));
  let data;
  try { data = await loadJSON(root.dataset.staff || 'staff.json'); }
  catch (e) { root.replaceChildren(el('p', { class: 'empty', text: 'The staff list could not be loaded right now. Try again in a minute.' })); return; }
  root.replaceChildren();
  renderStaffSections(root, teamGroups(data).staff);
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
    const select = b => {
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
    };
    buttons.forEach(b => b.addEventListener('click', () => select(b)));
    tabs._select = name => { const b = buttons.find(x => x.dataset.tab === name); if (b) select(b); };
    requestAnimationFrame(() => place(buttons.find(b => b.classList.contains('on')) || buttons[0]));
    window.addEventListener('resize', () => place(buttons.find(b => b.classList.contains('on')) || buttons[0]));
  });
  if (location.hash === '#retired') {
    const tabs = document.querySelector('.tabs');
    if (tabs && tabs._select) tabs._select('panel-retired');
  }
}

const PROJECT_GROUPS = [
  ['launched', 'Launched', 'Live and ready to use.'],
  ['development', 'In development', 'Being built right now.'],
  ['planned', 'Planned', 'Decided on, coming later.'],
  ['consideration', 'In consideration', 'Ideas being weighed up.']
];

async function initProjects() {
  const root = document.getElementById('projects-root');
  if (!root) return;
  root.replaceChildren(skeleton(3));
  let data;
  try { data = await loadJSON('projects.json'); }
  catch (e) { root.replaceChildren(el('p', { class: 'empty', text: 'Projects could not be loaded right now. Try again in a minute.' })); return; }
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const board = el('div', { class: 'board' });
  PROJECT_GROUPS.forEach(([key, title, hint]) => {
    const items = projects.filter(p => p && p.status === key);
    const col = el('section', { class: 'board-col col-' + key, id: 'projects-' + key }, [
      el('div', { class: 'board-head' }, [el('span', { class: 'board-dot' }), el('h2', { text: title }), el('span', { class: 'count', text: String(items.length) })]),
      el('p', { class: 'hint', text: hint })
    ]);
    if (!items.length) col.appendChild(el('p', { class: 'board-empty', text: 'Nothing here right now.' }));
    items.forEach(p => {
      const card = el('article', { class: 'project' }, [el('h3', { text: String(p.name || 'Untitled') })]);
      if (p.description) card.appendChild(el('p', { text: String(p.description) }));
      const meta = el('div', { class: 'project-meta' });
      if (p.date) meta.appendChild(el('span', { text: fmtDate(String(p.date)) }));
      (Array.isArray(p.tags) ? p.tags : []).slice(0, 4).forEach(t => meta.appendChild(el('span', { class: 'chip-tag', text: String(t) })));
      if (meta.children.length) card.appendChild(meta);
      col.appendChild(card);
    });
    board.appendChild(col);
  });
  root.replaceChildren(board);
  reveal(root);
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

document.addEventListener('DOMContentLoaded', () => {
  buildChrome();
  initSpotlight();
  initTabs();
  initTeam();
  initStatusPill();
  initHomeStats();
  initLiveNumbers();
  Live.start();
  initCompare();
  initStatus();
  initStaff();
  initCommands();
  initDocs();
  initChangelog();
  initTools();
  initFaq();
  initFilter();
  initProjects();
  initMarquee();
  initFeatures();
  reveal(document);
});
