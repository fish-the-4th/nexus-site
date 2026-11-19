const DASH_API = 'https://nexus-bot.wispbyte.org';
const TOKEN_KEY = 'nexus_dash_token';

function dashRoot() { return document.getElementById('dash-root'); }
function dashClear() { const r = dashRoot(); r.replaceChildren(); return r; }

function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
}
function setToken(t) {
  try { if (t) sessionStorage.setItem(TOKEN_KEY, t); else sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
}

function safeIcon(url) {
  return typeof url === 'string' && url.indexOf('https://cdn.discordapp.com/') === 0 ? url : null;
}

function guildPath(guildId, rest) {
  return '/api/guilds/' + encodeURIComponent(guildId) + rest;
}

function fmtDay(ts) {
  if (!ts) return 'Unknown';
  return new Date(ts * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtWhen(ts) {
  if (!ts) return 'Unknown';
  return new Date(ts * 1000).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function fmtSince(ts) {
  if (!ts) return 'Unknown';
  const days = Math.max(0, Math.floor((Date.now() / 1000 - ts) / 86400));
  if (days < 1) return 'Less than a day';
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const rest = days - years * 365 - months * 30;
  const parts = [];
  if (years) parts.push(years + (years === 1 ? ' year' : ' years'));
  if (months) parts.push(months + (months === 1 ? ' month' : ' months'));
  if (!years && rest) parts.push(rest + (rest === 1 ? ' day' : ' days'));
  return parts.join(', ');
}

function fmtIn(ts) {
  const s = Math.max(0, ts - Math.floor(Date.now() / 1000));
  if (s < 3600) return 'in ' + Math.max(1, Math.round(s / 60)) + ' min';
  if (s < 86400) return 'in ' + Math.round(s / 3600) + ' h';
  return 'in ' + Math.round(s / 86400) + ' days';
}

function fmtMinutes(m) {
  if (!m) return '0 min';
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h + 'h' + (r ? ' ' + r + 'm' : '');
}

async function dashFetch(path, options) {
  const opts = Object.assign({ headers: {} }, options || {});
  opts.headers = Object.assign({}, opts.headers);
  const token = getToken();
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (opts.body) opts.headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(DASH_API + path, opts);
  } catch (e) {
    throw new Error('Could not reach Nexus right now. Try again in a moment.');
  }
  let data = {};
  try { data = await res.json(); } catch (e) {}
  if (res.status === 401) {
    setToken(null);
    const err = new Error(data.error || 'Please log in again.');
    err.loggedOut = true;
    throw err;
  }
  if (!res.ok) throw new Error(data.error || 'Something went wrong (error ' + res.status + ').');
  return data;
}

function send(method, path, body) {
  return dashFetch(path, { method: method, body: body ? JSON.stringify(body) : undefined });
}

function showLogin(message, isError) {
  const root = dashClear();
  if (message) root.appendChild(el('div', { class: 'callout' + (isError ? ' warn' : ''), text: message }));
  const perks = [
    ['📊', 'Your stats', 'Messages, voice time and rank in every server you share with Nexus.'],
    ['🧾', 'Your history', 'Your own moderation record, reminders, giveaways and game stats.'],
    ['⚙️', 'Server settings', 'Owners and admins can manage Nexus without typing commands.']
  ];
  root.appendChild(el('div', { class: 'login-card' }, [
    el('div', { class: 'login-glow', 'aria-hidden': 'true' }),
    el('img', { class: 'login-logo', src: ROOT + 'logo.png', alt: '' }),
    el('h2', { text: 'Log in to continue' }),
    el('p', { class: 'hint', text: 'Nexus only asks for your Discord username and avatar. It never sees your password, email or server list.' }),
    el('a', { class: 'btn btn-primary btn-lg', href: DASH_API + '/auth/login', text: 'Log in with Discord' }),
    el('div', { class: 'login-perks' }, perks.map((p, i) => el('div', { class: 'perk', style: '--i:' + i }, [
      el('span', { class: 'perk-ico', text: p[0] }),
      el('b', { text: p[1] }),
      el('small', { text: p[2] })
    ])))
  ]));
}

function userBar(user) {
  const bar = el('div', { class: 'dash-bar' });
  const who = el('div', { class: 'dash-user' });
  const pic = safeIcon(user.avatar);
  if (pic) who.appendChild(el('img', { src: pic, alt: '' }));
  who.appendChild(el('span', { text: user.name }));
  const out = el('button', { class: 'btn btn-outline', type: 'button', text: 'Log out' });
  out.addEventListener('click', async () => {
    try { await dashFetch('/auth/logout', { method: 'POST' }); } catch (e) {}
    setToken(null);
    showLogin('You are logged out.');
  });
  bar.appendChild(who);
  bar.appendChild(out);
  return bar;
}

function backButton(label, onClick) {
  const b = el('button', { class: 'dash-back', type: 'button', text: '← ' + label });
  b.addEventListener('click', onClick);
  return b;
}

function guildIcon(guild) {
  const box = el('span', { class: 'gicon' });
  const pic = safeIcon(guild.icon);
  if (pic) box.appendChild(el('img', { src: pic, alt: '' }));
  else box.textContent = (guild.name || '?').charAt(0).toUpperCase();
  return box;
}

function loading(root, text) {
  const p = el('div', { class: 'dash-loading', role: 'status', 'aria-label': text }, [
    el('p', { class: 'empty', text: text }), skeleton(3)
  ]);
  root.appendChild(p);
  return p;
}

function failInto(root, e, keep) {
  if (e.loggedOut) { showLogin(e.message, true); return; }
  root.replaceChildren.apply(root, keep.concat([el('div', { class: 'callout warn', text: e.message })]));
}

function status() {
  const box = el('div', { class: 'dash-msg', role: 'status' });
  box.set = (text, kind) => { box.className = 'dash-msg' + (kind ? ' ' + kind : ''); box.textContent = text || ''; };
  return box;
}

async function run(button, msg, work, okText) {
  if (button) button.disabled = true;
  msg.set('Saving...');
  try {
    const out = await work();
    msg.set(okText || 'Saved.', 'ok');
    return out;
  } catch (e) {
    if (e.loggedOut) { showLogin(e.message, true); return undefined; }
    msg.set(e.message, 'bad');
    return undefined;
  } finally {
    if (button) button.disabled = false;
  }
}

function section(id, title, hint, kids) {
  const s = el('section', { class: 'dash-panel dash-section spot', id: id });
  s.appendChild(el('h3', { text: title }));
  if (hint) s.appendChild(el('p', { class: 'hint', text: hint }));
  (kids || []).forEach(k => s.appendChild(k));
  return s;
}

function layout(root, groups) {
  const side = el('nav', { class: 'dash-side', 'aria-label': 'Sections' });
  const main = el('div', { class: 'dash-main' });
  groups.forEach(g => {
    if (g.title) {
      const head = el('button', { class: 'side-head' + (g.active ? ' on' : ''), type: 'button', text: g.title });
      if (g.onClick) head.addEventListener('click', g.onClick);
      else head.disabled = true;
      side.appendChild(head);
    }
    (g.items || []).forEach(item => {
      const link = el('a', { href: '#' + item.id, text: item.label });
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.getElementById(item.id);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        side.querySelectorAll('a').forEach(a => a.classList.toggle('on', a === link));
      });
      side.appendChild(link);
    });
  });
  root.appendChild(el('div', { class: 'dash-layout' }, [side, main]));
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        side.querySelectorAll('a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-110px 0px -65% 0px' });
    const watch = () => main.querySelectorAll('.dash-section').forEach(s => { if (!s._watched) { s._watched = true; spy.observe(s); } });
    new MutationObserver(watch).observe(main, { childList: true });
    watch();
  }
  return main;
}

function chip(text, onRemove) {
  const c = el('span', { class: 'chip' }, [el('span', { text: text })]);
  if (onRemove) {
    const x = el('button', { type: 'button', class: 'chip-x', 'aria-label': 'Remove ' + text, text: '×' });
    x.addEventListener('click', onRemove);
    c.appendChild(x);
  }
  return c;
}

function select(options, placeholder) {
  const s = el('select', { class: 'search dash-select' });
  if (placeholder) s.appendChild(el('option', { value: '', text: placeholder }));
  options.forEach(o => s.appendChild(el('option', { value: o.id, text: o.name })));
  return s;
}

function toggle(label, checked) {
  const box = el('input', { type: 'checkbox' });
  box.checked = !!checked;
  const wrap = el('label', { class: 'dash-toggle' }, [box, el('span', { text: label })]);
  wrap.input = box;
  return wrap;
}

function textInput(value, attrs) {
  const i = el('input', Object.assign({ class: 'search', type: 'text', autocomplete: 'off' }, attrs || {}));
  i.value = value || '';
  return i;
}

async function showGuilds(user) {
  const root = dashClear();
  root.appendChild(userBar(user));
  const wait = loading(root, 'Loading your servers...');
  let data;
  try {
    data = await dashFetch('/api/guilds');
  } catch (e) {
    return failInto(root, e, [userBar(user)]);
  }
  wait.remove();
  root.appendChild(el('h3', { text: 'Choose a server', style: 'margin-bottom:12px' }));
  if (!data.guilds.length) {
    root.appendChild(el('div', { class: 'callout', text: 'No servers found. You need to be in a server that has Nexus.' }));
    return;
  }
  const list = el('div', { class: 'guild-list' });
  data.guilds.forEach((g, i) => {
    const meta = el('span', { class: 'gmeta', text: g.members + ' members' });
    if (g.admin) meta.appendChild(el('span', { class: 'gtag', text: 'Admin' }));
    const card = el('button', { class: 'guild-card spot', type: 'button', style: '--i:' + i }, [
      guildIcon(g),
      el('span', { class: 'gtext' }, [el('span', { class: 'gname', text: g.name }), meta])
    ]);
    card.addEventListener('click', () => showChooser(user, g));
    list.appendChild(card);
  });
  root.appendChild(list);
}

function showChooser(user, guild) {
  const root = dashClear();
  root.appendChild(userBar(user));
  root.appendChild(backButton('All servers', () => showGuilds(user)));
  root.appendChild(el('div', { class: 'dash-title' }, [guildIcon(guild), el('h2', { text: guild.name })]));

  const options = el('div', { class: 'choice-list' });
  const mine = el('button', { class: 'choice-card spot', type: 'button' }, [
    el('span', { class: 'choice-icon', text: '👤' }),
    el('span', {}, [
      el('b', { text: 'My dashboard' }),
      el('small', { text: 'Your profile, stats, history, reminders, giveaways and games in this server.' })
    ])
  ]);
  mine.addEventListener('click', () => showProfile(user, guild));
  options.appendChild(mine);

  const admin = el('button', { class: 'choice-card spot' + (guild.admin ? '' : ' locked'), type: 'button', style: '--i:1' }, [
    el('span', { class: 'choice-icon', text: guild.admin ? '⚙️' : '🔒' }),
    el('span', {}, [
      el('b', { text: 'Admin dashboard' }),
      el('small', { text: guild.admin ? 'Change how Nexus works in this server.' : 'Only the server owner and members with Administrator can open this.' })
    ])
  ]);
  if (guild.admin) admin.addEventListener('click', () => showAdmin(user, guild, 'general'));
  else admin.disabled = true;
  options.appendChild(admin);
  root.appendChild(options);
}

function statTile(value, label) {
  const num = el('b', { text: String(value) });
  if (typeof value === 'number' && isFinite(value) && typeof animateNumber === 'function') {
    num.textContent = '0';
    requestAnimationFrame(() => animateNumber(num, value));
  }
  return el('div', { class: 'stat-tile spot' }, [num, el('span', { text: label })]);
}

function caseRow(c, detailed, showModerator) {
  const head = el('div', { class: 'case-head' }, [
    el('span', { class: 'case-type', text: c.type }),
    el('code', { text: c.case }),
    el('span', { class: 'case-when', text: fmtDay(c.time) })
  ]);
  const row = el('div', { class: 'case-row' }, [head]);
  if (detailed) {
    if (showModerator) {
      row.appendChild(el('p', { text: 'Member: ' + c.target + (c.target_id ? ' (' + c.target_id + ')' : '') }));
      row.appendChild(el('p', { text: 'Moderator: ' + c.moderator + (c.moderator_id ? ' (' + c.moderator_id + ')' : '') }));
      row.appendChild(el('p', { class: 'case-dur', text: 'When: ' + fmtWhen(c.time) }));
    }
    row.appendChild(el('p', { text: 'Reason: ' + c.reason }));
    if (c.duration) row.appendChild(el('p', { class: 'case-dur', text: 'Duration: ' + c.duration }));
  }
  return row;
}

const USER_SECTIONS = [
  { id: 'u-profile', label: 'Profile' },
  { id: 'u-stats', label: 'Stats' },
  { id: 'u-cases', label: 'Moderation history' },
  { id: 'u-reminders', label: 'Reminders' },
  { id: 'u-giveaways', label: 'Giveaways' },
  { id: 'u-access', label: 'Command access' },
  { id: 'u-games', label: 'Game stats' }
];

async function showProfile(user, guild) {
  const root = dashClear();
  const back = backButton(guild.name, () => showChooser(user, guild));
  root.appendChild(userBar(user));
  root.appendChild(back);
  const wait = loading(root, 'Loading your dashboard...');
  let data;
  try {
    data = await dashFetch(guildPath(guild.id, '/me'));
  } catch (e) {
    return failInto(root, e, [userBar(user), back]);
  }
  wait.remove();
  const main = layout(root, [{ title: 'My dashboard', items: USER_SECTIONS }]);
  const m = data.member;
  const s = data.stats;

  const pic = safeIcon(m.avatar);
  const badges = el('div', { class: 'profile-badges' });
  if (m.is_owner) badges.appendChild(el('span', { class: 'gtag', text: 'Owner' }));
  else if (m.is_admin) badges.appendChild(el('span', { class: 'gtag', text: 'Admin' }));
  const profile = el('section', { class: 'dash-panel dash-section profile', id: 'u-profile' }, [
    pic ? el('img', { class: 'profile-pic', src: pic, alt: '' }) : el('span', { class: 'profile-pic' }),
    el('div', { class: 'profile-main' }, [
      el('h2', { text: m.display_name }),
      el('p', { class: 'hint', text: '@' + m.username }),
      badges,
      el('dl', { class: 'profile-facts' }, [
        el('dt', { text: 'Discord ID' }), el('dd', {}, [el('code', { text: m.id })]),
        el('dt', { text: 'Joined this server' }), el('dd', { text: fmtDay(m.joined_at) }),
        el('dt', { text: 'Time in the server' }), el('dd', { text: fmtSince(m.joined_at) }),
        el('dt', { text: 'Account created' }), el('dd', { text: fmtDay(m.created_at) })
      ])
    ])
  ]);
  main.appendChild(profile);

  const more = el('button', { class: 'btn btn-primary', type: 'button', text: 'See all my stats' });
  more.addEventListener('click', () => showStats(user, guild));
  main.appendChild(section('u-stats', 'Your stats', 'Activity from the last 30 days. Nexus counts messages, it never saves what they say.', [
    el('div', { class: 'stat-grid' }, [
      statTile(s.messages_7d, 'messages this week'),
      statTile(s.messages_30d, 'messages in 30 days'),
      statTile(fmtMinutes(s.voice_minutes_30d), 'in voice, 30 days'),
      statTile(s.rank ? '#' + s.rank : '-', s.rank ? 'of ' + s.ranked_members + ' by messages' : 'no messages yet')
    ]),
    el('div', { style: 'margin-top:14px' }, [more])
  ]));

  main.appendChild(caseSection(guild, data.cases));

  const reminders = section('u-reminders', 'Active reminders', 'Reminders you set in this server that have not gone off yet.');
  const giveaways = section('u-giveaways', 'Giveaways', 'Giveaways running in this server right now, and whether you have entered.');
  const access = section('u-access', 'Command access', 'What you can use in this server, based on your roles and any changes the admins made.');
  const games = section('u-games', 'Game stats', 'Your results across every server. Games are not tied to one server.');
  [reminders, giveaways, access, games].forEach(x => { x.appendChild(el('p', { class: 'empty', text: 'Loading...' })); main.appendChild(x); });

  dashFetch(guildPath(guild.id, '/me/extras')).then(extra => {
    fillReminders(reminders, extra.reminders);
    fillAccess(access, extra.access);
    fillGames(games, extra.games);
  }).catch(e => {
    if (e.loggedOut) return showLogin(e.message, true);
    [reminders, access, games].forEach(x => { x.lastChild.replaceWith(el('p', { class: 'dash-msg bad', text: e.message })); });
  });
  dashFetch(guildPath(guild.id, '/me/giveaways')).then(g => fillGiveaways(giveaways, g.giveaways)).catch(e => {
    if (e.loggedOut) return;
    giveaways.lastChild.replaceWith(el('p', { class: 'dash-msg bad', text: e.message }));
  });
}

function caseSection(guild, c) {
  const panel = section('u-cases', 'Your moderation history');
  if (!c.total) {
    panel.appendChild(el('p', { class: 'hint', text: 'Nothing on record. Nice and clean.' }));
    return panel;
  }
  panel.appendChild(el('p', { class: 'hint', text: c.total + (c.total === 1 ? ' case' : ' cases') + ' on record in this server.' }));
  const chips = el('div', { class: 'case-chips' });
  Object.keys(c.types).forEach(t => chips.appendChild(el('span', { class: 'gtag', text: t + ' × ' + c.types[t] })));
  panel.appendChild(chips);
  const list = el('div', { class: 'case-list' });
  c.latest.forEach(x => list.appendChild(caseRow(x, false)));
  panel.appendChild(list);
  const btn = el('button', { class: 'btn btn-outline', type: 'button', text: 'Show all details' });
  const msg = status();
  let open = false;
  btn.addEventListener('click', async () => {
    if (open) {
      list.replaceChildren();
      c.latest.forEach(x => list.appendChild(caseRow(x, false)));
      btn.textContent = 'Show all details';
      open = false;
      return;
    }
    const full = await run(btn, msg, () => dashFetch(guildPath(guild.id, '/me/cases')), ' ');
    if (!full) return;
    msg.set('');
    list.replaceChildren();
    full.cases.forEach(x => list.appendChild(caseRow(x, true)));
    btn.textContent = 'Hide details';
    open = true;
  });
  panel.appendChild(el('div', { style: 'margin-top:14px' }, [btn, msg]));
  return panel;
}

function fillReminders(panel, items) {
  panel.lastChild.remove();
  if (!items.length) { panel.appendChild(el('p', { class: 'hint', text: 'No active reminders. Set one with -reminder create.' })); return; }
  const list = el('div', { class: 'case-list' });
  items.forEach(r => list.appendChild(el('div', { class: 'case-row' }, [
    el('div', { class: 'case-head' }, [el('span', { class: 'case-type', text: fmtIn(r.time) }), el('span', { class: 'case-when', text: fmtWhen(r.time) })]),
    el('p', { text: r.text }),
    r.channel ? el('p', { class: 'case-dur', text: 'In ' + r.channel }) : el('span')
  ])));
  panel.appendChild(list);
}

function fillGiveaways(panel, items) {
  panel.lastChild.remove();
  if (!items.length) { panel.appendChild(el('p', { class: 'hint', text: 'No giveaways are running right now.' })); return; }
  const list = el('div', { class: 'case-list' });
  items.forEach(g => {
    const state = g.entered === true ? el('span', { class: 'gtag ok', text: "You're in" })
      : g.entered === false ? el('span', { class: 'gtag', text: 'Not entered' })
      : el('span', { class: 'gtag', text: 'Could not check' });
    list.appendChild(el('div', { class: 'case-row' }, [
      el('div', { class: 'case-head' }, [el('span', { class: 'case-type', text: g.prize }), state, el('span', { class: 'case-when', text: 'Ends ' + fmtIn(g.ends) })]),
      el('p', { class: 'case-dur', text: g.winners + (g.winners === 1 ? ' winner' : ' winners') + ' · ' + g.channel }),
      el('a', { class: 'inline-link', href: g.link, target: '_blank', rel: 'noopener', text: g.entered ? 'Open in Discord' : 'Open in Discord to enter' })
    ]));
  });
  panel.appendChild(list);
}

function fillAccess(panel, items) {
  panel.lastChild.remove();
  const search = textInput('', { placeholder: 'Search commands', 'aria-label': 'Search commands' });
  const onlyMine = toggle('Only show what I can use', false);
  const list = el('div', { class: 'access-list' });
  function draw() {
    const q = search.value.trim().toLowerCase();
    list.replaceChildren();
    let shown = 0;
    items.forEach(c => {
      if (onlyMine.input.checked && c.allowed !== true) return;
      if (q && (c.name + ' ' + c.desc + ' ' + c.category).toLowerCase().indexOf(q) < 0) return;
      shown++;
      const tag = c.allowed === true ? el('span', { class: 'gtag ok', text: 'Yes' })
        : c.allowed === false ? el('span', { class: 'gtag no', text: 'No' })
        : el('span', { class: 'gtag', text: 'Depends' });
      list.appendChild(el('div', { class: 'access-row' }, [el('code', { text: c.usage }), el('span', { class: 'access-desc', text: c.desc }), tag]));
    });
    if (!shown) list.appendChild(el('p', { class: 'hint', text: 'Nothing matches.' }));
  }
  search.addEventListener('input', draw);
  onlyMine.input.addEventListener('change', draw);
  panel.appendChild(el('div', { class: 'dash-row', style: 'margin-bottom:10px' }, [search, onlyMine]));
  panel.appendChild(list);
  draw();
}

function fillGames(panel, items) {
  panel.lastChild.remove();
  if (!items.length) { panel.appendChild(el('p', { class: 'hint', text: 'No games played yet. Try -games.' })); return; }
  const table = el('table', { class: 'ref' });
  table.appendChild(el('thead', {}, [el('tr', {}, ['Game', 'Wins', 'Losses', 'Draws', 'Streak', 'Best streak', 'Best score'].map(h => el('th', { text: h })))]));
  const body = el('tbody');
  items.forEach(g => body.appendChild(el('tr', {}, [g.game, g.wins, g.losses, g.draws, g.streak, g.best_streak, g.best_score || '-'].map(v => el('td', { text: String(v) })))));
  table.appendChild(body);
  panel.appendChild(el('div', { class: 'table-wrap' }, [table]));
}

function barChart(values, now, format) {
  const max = Math.max.apply(null, values.concat([1]));
  const chart = el('div', { class: 'bars', role: 'img' });
  values.forEach((v, i) => {
    const day = new Date((now - (29 - i) * 86400) * 1000);
    const label = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ': ' + format(v);
    chart.appendChild(el('span', { class: 'bar', title: label, style: 'height:' + Math.max(2, Math.round(v / max * 100)) + '%' }));
  });
  const total = values.reduce((a, b) => a + b, 0);
  chart.setAttribute('aria-label', 'Last 30 days, ' + format(total) + ' in total');
  return el('div', {}, [chart, el('div', { class: 'bars-axis' }, [el('span', { text: '30 days ago' }), el('span', { text: 'Today' })])]);
}

function topList(items, format, emptyText) {
  if (!items.length) return el('p', { class: 'hint', text: emptyText });
  const list = el('ol', { class: 'top-list' });
  items.forEach(x => list.appendChild(el('li', {}, [el('span', { text: x.name }), el('b', { text: format(x) })])));
  return list;
}

async function showStats(user, guild) {
  const root = dashClear();
  const back = backButton('My dashboard', () => showProfile(user, guild));
  root.appendChild(userBar(user));
  root.appendChild(back);
  const wait = loading(root, 'Loading your stats...');
  let data;
  try {
    data = await dashFetch(guildPath(guild.id, '/me/stats'));
  } catch (e) {
    return failInto(root, e, [userBar(user), back]);
  }
  wait.remove();
  const s = data.summary;
  root.appendChild(el('div', { class: 'dash-title' }, [guildIcon(guild), el('h2', { text: 'Your stats in ' + guild.name })]));

  root.appendChild(el('div', { class: 'stat-grid', style: 'margin-bottom:16px' }, [
    statTile(s.messages_7d, 'messages this week'),
    statTile(s.messages_30d, 'messages in 30 days'),
    statTile(fmtMinutes(s.voice_minutes_7d), 'in voice this week'),
    statTile(fmtMinutes(s.voice_minutes_30d), 'in voice, 30 days'),
    statTile(s.invites_30d, 'people joined with your invites'),
    statTile(s.rank ? '#' + s.rank : '-', s.rank ? 'of ' + s.ranked_members + ' by messages' : 'not ranked yet')
  ]));

  root.appendChild(el('div', { class: 'dash-panel' }, [
    el('h3', { text: 'Messages per day' }),
    barChart(data.daily_messages, data.now, v => v + (v === 1 ? ' message' : ' messages'))
  ]));
  root.appendChild(el('div', { class: 'dash-panel' }, [
    el('h3', { text: 'Voice time per day' }),
    barChart(data.daily_voice_minutes, data.now, fmtMinutes)
  ]));
  root.appendChild(el('div', { class: 'dash-cols' }, [
    el('div', { class: 'dash-panel' }, [
      el('h3', { text: 'Where you chat most' }),
      topList(data.top_text, x => String(x.count), 'No messages in the last 30 days.')
    ]),
    el('div', { class: 'dash-panel' }, [
      el('h3', { text: 'Where you talk most' }),
      topList(data.top_voice, x => fmtMinutes(x.minutes), 'No voice time in the last 30 days.')
    ])
  ]));
  root.appendChild(el('p', { class: 'hint', text: 'Stats cover the last 30 days. Older activity is deleted automatically.' }));
}

const ADMIN_PAGES = {
  general: { title: 'General', items: [
    { id: 'a-prefix', label: 'Prefix' },
    { id: 'a-errors', label: 'Error log' },
    { id: 'a-access', label: 'Command access' }
  ] },
  moderation: { title: 'Moderation', items: [
    { id: 'a-modsettings', label: 'Settings' },
    { id: 'a-immunity', label: 'Immune roles' },
    { id: 'a-cases', label: 'Case search' },
    { id: 'a-notes', label: 'Notes' },
    { id: 'a-automod', label: 'AutoMod' }
  ] }
};

async function showAdmin(user, guild, page) {
  const root = dashClear();
  const back = backButton(guild.name, () => showChooser(user, guild));
  root.appendChild(userBar(user));
  root.appendChild(back);
  const wait = loading(root, 'Loading settings...');
  let data;
  try {
    data = await dashFetch(guildPath(guild.id, '/' + page));
  } catch (e) {
    return failInto(root, e, [userBar(user), back]);
  }
  wait.remove();
  root.appendChild(el('div', { class: 'dash-title' }, [guildIcon(data.guild), el('h2', { text: data.guild.name + ' · ' + ADMIN_PAGES[page].title })]));
  const groups = Object.keys(ADMIN_PAGES).map(key => ({
    title: ADMIN_PAGES[key].title,
    active: key === page,
    onClick: key === page ? null : () => showAdmin(user, guild, key),
    items: key === page ? ADMIN_PAGES[key].items : []
  }));
  const main = layout(root, groups);
  if (page === 'general') buildGeneral(main, guild, data);
  else buildModeration(main, guild, data);
  window.scrollTo(0, 0);
}

function buildGeneral(main, guild, data) {
  const input = textInput(data.prefix, { maxlength: '5', 'aria-label': 'Prefix', spellcheck: 'false' });
  const save = el('button', { class: 'btn btn-primary', type: 'button', text: 'Save' });
  const msg = status();
  save.addEventListener('click', async () => {
    const out = await run(save, msg, () => send('PUT', guildPath(guild.id, '/prefix'), { prefix: input.value }));
    if (out) { input.value = out.prefix; msg.set('Saved. Nexus now answers to ' + out.prefix + ' in this server.', 'ok'); }
  });
  main.appendChild(section('a-prefix', 'Prefix', 'The character or short word that goes before commands. Up to 5 characters, no spaces. Mentioning Nexus always works too.', [
    el('div', { class: 'dash-row' }, [input, save]), msg
  ]));

  const errPanel = section('a-errors', 'Error log', 'Things Nexus tried to do in this server but could not, such as giving a role that sits above its own. The newest is at the top. Up to 200 are kept for 30 days.');
  const errList = el('div', { class: 'case-list' });
  function drawErrors(items) {
    errList.replaceChildren();
    if (!items.length) { errList.appendChild(el('p', { class: 'hint', style: 'padding:12px 14px;margin:0', text: 'No errors. Everything is working.' })); return; }
    items.forEach(x => errList.appendChild(el('div', { class: 'case-row' }, [
      el('div', { class: 'case-head' }, [el('span', { class: 'case-type', text: x.source }), el('span', { class: 'case-when', text: fmtWhen(x.time) })]),
      el('p', { text: x.message })
    ])));
  }
  drawErrors(data.errors);
  const clear = el('button', { class: 'btn btn-outline', type: 'button', text: 'Clear the log' });
  const clearMsg = status();
  clear.addEventListener('click', async () => {
    if (!confirm('Clear every error in the log for this server?')) return;
    const out = await run(clear, clearMsg, () => send('POST', guildPath(guild.id, '/errors/clear')), 'Cleared.');
    if (out) drawErrors([]);
  });
  errPanel.appendChild(errList);
  errPanel.appendChild(el('div', { style: 'margin-top:12px' }, [clear, clearMsg]));
  main.appendChild(errPanel);

  const accPanel = section('a-access', 'Command access', 'Let roles or members use a command without its usual permission, or change which permission it needs. This is the same as the -permission command. Locked commands can never be changed.');
  const search = textInput('', { placeholder: 'Search commands', 'aria-label': 'Search commands' });
  const changedOnly = toggle('Only show changed commands', false);
  const list = el('div', { class: 'access-list' });
  const byName = {};
  data.commands.forEach(c => { byName[c.name] = c; });

  function editor(c) {
    const box = el('div', { class: 'access-edit' });
    const msg = status();
    async function change(kind, value, on) {
      const out = await run(null, msg, () => send('PUT', guildPath(guild.id, '/access'), { command: c.name, kind: kind, value: value, on: on }));
      if (out) { byName[c.name] = out.command; draw(c.name); }
    }
    const permSel = select(data.permissions, c.permission ? 'Use its usual permission (' + c.default + ')' : 'Usual permission: ' + c.default);
    if (c.permission) permSel.value = c.permission;
    permSel.addEventListener('change', () => change('permission', permSel.value, !!permSel.value));
    box.appendChild(el('label', { class: 'field-label', text: 'Permission it needs' }));
    box.appendChild(permSel);

    box.appendChild(el('label', { class: 'field-label', text: 'Roles that can always use it' }));
    const roleChips = el('div', { class: 'chips' });
    c.roles.forEach(r => roleChips.appendChild(chip(r.name, () => change('role', r.id, false))));
    if (!c.roles.length) roleChips.appendChild(el('span', { class: 'hint', text: 'None' }));
    const roleSel = select(data.roles.filter(r => !c.roles.some(x => x.id === r.id)), 'Add a role...');
    roleSel.addEventListener('change', () => { if (roleSel.value) change('role', roleSel.value, true); });
    box.appendChild(roleChips);
    box.appendChild(roleSel);

    box.appendChild(el('label', { class: 'field-label', text: 'Members who can always use it' }));
    const userChips = el('div', { class: 'chips' });
    c.users.forEach(u => userChips.appendChild(chip(u.name, () => change('user', u.id, false))));
    if (!c.users.length) userChips.appendChild(el('span', { class: 'hint', text: 'None' }));
    const userId = textInput('', { placeholder: 'Member user ID', inputmode: 'numeric' });
    const addUser = el('button', { class: 'btn btn-outline', type: 'button', text: 'Add' });
    addUser.addEventListener('click', () => { if (userId.value.trim()) change('user', userId.value.trim(), true); });
    box.appendChild(userChips);
    box.appendChild(el('div', { class: 'dash-row' }, [userId, addUser]));
    box.appendChild(msg);
    return box;
  }

  let openName = null;
  function draw(keepOpen) {
    if (keepOpen !== undefined) openName = keepOpen;
    const q = search.value.trim().toLowerCase();
    list.replaceChildren();
    let shown = 0;
    data.commands.forEach(base => {
      const c = byName[base.name];
      const changed = c.permission || c.roles.length || c.users.length;
      if (changedOnly.input.checked && !changed) return;
      if (q && (c.name + ' ' + c.desc + ' ' + c.category).toLowerCase().indexOf(q) < 0) return;
      shown++;
      const tags = el('span', { class: 'access-tags' });
      if (c.locked) tags.appendChild(el('span', { class: 'gtag', text: '🔒 Locked' }));
      else if (changed) tags.appendChild(el('span', { class: 'gtag ok', text: 'Changed' }));
      tags.appendChild(el('span', { class: 'gtag', text: c.permission_label || c.default }));
      const head = el('button', { class: 'access-head', type: 'button', 'aria-expanded': openName === c.name ? 'true' : 'false' }, [
        el('code', { text: c.usage }), el('span', { class: 'access-desc', text: c.desc }), tags
      ]);
      const row = el('div', { class: 'access-item' + (openName === c.name ? ' open' : '') }, [head]);
      if (c.locked) head.disabled = true;
      else head.addEventListener('click', () => draw(openName === c.name ? null : c.name));
      if (openName === c.name && !c.locked) row.appendChild(editor(c));
      list.appendChild(row);
    });
    if (!shown) list.appendChild(el('p', { class: 'hint', style: 'padding:12px 14px;margin:0', text: 'Nothing matches.' }));
  }
  search.addEventListener('input', () => draw());
  changedOnly.input.addEventListener('change', () => draw());
  accPanel.appendChild(el('div', { class: 'dash-row', style: 'margin-bottom:10px' }, [search, changedOnly]));
  accPanel.appendChild(list);
  main.appendChild(accPanel);
  draw();
}

const ACTION_NAMES = { warn: 'Warns', mute: 'Mutes', kick: 'Kicks', ban: 'Bans' };
const AUTOMOD_NAMES = { spam: 'Spam detection', scam: 'Scam and malicious links', raids: 'Raid protection' };

function buildModeration(main, guild, data) {
  const st = data.settings;
  const dm = toggle('Send members a DM when they are warned, muted, kicked or banned', st.dm_members);
  const showCase = toggle('Include the case number in that DM', st.dm_show_case);
  const needReason = toggle('Require a reason for every warn, mute, kick and ban', st.require_reason);
  const footer = el('textarea', { class: 'search', rows: '3', maxlength: '500', placeholder: 'For example: You can appeal in our support server.' });
  footer.value = st.dm_footer;
  const reason = textInput(st.default_reason, { maxlength: '200' });
  const save = el('button', { class: 'btn btn-primary', type: 'button', text: 'Save settings' });
  const msg = status();
  save.addEventListener('click', () => run(save, msg, () => send('PUT', guildPath(guild.id, '/moderation/settings'), {
    dm_members: dm.input.checked, dm_show_case: showCase.input.checked, require_reason: needReason.input.checked,
    dm_footer: footer.value, default_reason: reason.value
  })));
  main.appendChild(section('a-modsettings', 'Moderation settings', 'How warns, mutes, kicks and bans behave in this server.', [
    dm, showCase, needReason,
    el('label', { class: 'field-label', text: 'Extra note at the bottom of the DM (optional)' }), footer,
    el('label', { class: 'field-label', text: 'Reason used when a moderator leaves it blank' }), reason,
    el('div', { style: 'margin-top:14px' }, [save]), msg
  ]));

  const imm = section('a-immunity', 'Immune roles', 'Members with these roles cannot be given that kind of action, even by moderators who are allowed to use it. Role hierarchy still applies on top of this.');
  const grid = el('div', { class: 'immune-grid' });
  Object.keys(ACTION_NAMES).forEach(action => {
    const box = el('div', { class: 'immune-box' });
    const msg = status();
    function draw(roles) {
      box.replaceChildren(el('b', { text: ACTION_NAMES[action] }));
      const chips = el('div', { class: 'chips' });
      roles.forEach(r => chips.appendChild(chip(r.name, () => change(r.id, false))));
      if (!roles.length) chips.appendChild(el('span', { class: 'hint', text: 'No immune roles' }));
      const sel = select(data.roles.filter(r => !roles.some(x => x.id === r.id)), 'Add a role...');
      sel.addEventListener('change', () => { if (sel.value) change(sel.value, true); });
      box.appendChild(chips);
      box.appendChild(sel);
      box.appendChild(msg);
    }
    async function change(role, on) {
      const out = await run(null, msg, () => send('PUT', guildPath(guild.id, '/moderation/immunity'), { action: action, role: role, on: on }));
      if (out) draw(out.roles);
    }
    draw(data.immunity[action] || []);
    grid.appendChild(box);
  });
  imm.appendChild(grid);
  main.appendChild(imm);

  const casePanel = section('a-cases', 'Case search', 'Search by case number, member name or ID, moderator, or words in the reason.');
  const q = textInput('', { placeholder: 'Case number, name, ID or reason' });
  const typeSel = select([], 'Any type');
  const go = el('button', { class: 'btn btn-primary', type: 'button', text: 'Search' });
  const caseMsg = status();
  const results = el('div', { class: 'case-list' });
  const pager = el('div', { class: 'dash-row', style: 'margin-top:10px' });
  let page = 0;
  async function search(p) {
    page = p;
    const params = '?q=' + encodeURIComponent(q.value.trim()) + '&type=' + encodeURIComponent(typeSel.value) + '&page=' + page;
    const out = await run(go, caseMsg, () => dashFetch(guildPath(guild.id, '/cases' + params)), ' ');
    if (!out) return;
    caseMsg.set(out.total + (out.total === 1 ? ' case found.' : ' cases found.'));
    if (typeSel.options.length === 1) out.types.forEach(t => typeSel.appendChild(el('option', { value: t, text: t })));
    results.replaceChildren();
    out.cases.forEach(c => {
      const row = caseRow(c, false);
      row.classList.add('clickable');
      row.addEventListener('click', () => row.replaceWith(caseRow(c, true, true)));
      results.appendChild(row);
    });
    pager.replaceChildren();
    if (page > 0) { const prev = el('button', { class: 'btn btn-outline', type: 'button', text: '← Newer' }); prev.addEventListener('click', () => search(page - 1)); pager.appendChild(prev); }
    if ((page + 1) * 25 < out.total) { const next = el('button', { class: 'btn btn-outline', type: 'button', text: 'Older →' }); next.addEventListener('click', () => search(page + 1)); pager.appendChild(next); }
  }
  go.addEventListener('click', () => search(0));
  q.addEventListener('keydown', e => { if (e.key === 'Enter') search(0); });
  typeSel.addEventListener('change', () => search(0));
  casePanel.appendChild(el('div', { class: 'dash-row' }, [q, typeSel, go]));
  casePanel.appendChild(caseMsg);
  casePanel.appendChild(results);
  casePanel.appendChild(pager);
  casePanel.appendChild(el('p', { class: 'hint', style: 'margin:10px 0 0', text: 'Click a case to see every detail.' }));
  main.appendChild(casePanel);
  search(0);

  const notesPanel = section('a-notes', 'Notes', 'Private staff notes about members. Members never see these.');
  const addId = textInput('', { placeholder: 'Member user ID', inputmode: 'numeric' });
  const addText = el('textarea', { class: 'search', rows: '2', maxlength: '1000', placeholder: 'What should staff know?' });
  const addBtn = el('button', { class: 'btn btn-primary', type: 'button', text: 'Add note' });
  const noteMsg = status();
  const nq = textInput('', { placeholder: 'Search notes by user ID, author or text' });
  const notesList = el('div', { class: 'case-list' });
  async function loadNotes() {
    try {
      const out = await dashFetch(guildPath(guild.id, '/notes?q=' + encodeURIComponent(nq.value.trim())));
      drawNotes(out.notes);
    } catch (e) {
      if (e.loggedOut) return showLogin(e.message, true);
      noteMsg.set(e.message, 'bad');
    }
  }
  function drawNotes(notes) {
    notesList.replaceChildren();
    if (!notes.length) { notesList.appendChild(el('p', { class: 'hint', style: 'padding:12px 14px;margin:0', text: 'No notes found.' })); return; }
    notes.forEach(n => {
      const text = el('p', { text: n.text });
      const edit = el('button', { class: 'btn btn-outline btn-small', type: 'button', text: 'Edit' });
      const del = el('button', { class: 'btn btn-outline btn-small danger', type: 'button', text: 'Delete' });
      const rowMsg = status();
      const row = el('div', { class: 'case-row' }, [
        el('div', { class: 'case-head' }, [el('span', { class: 'case-type', text: n.target }), el('code', { text: n.target_id }), el('span', { class: 'case-when', text: fmtDay(n.time) })]),
        text,
        el('p', { class: 'case-dur', text: 'Written by ' + n.author }),
        el('div', { class: 'dash-row', style: 'margin-top:6px' }, [edit, del]), rowMsg
      ]);
      edit.addEventListener('click', () => {
        const area = el('textarea', { class: 'search', rows: '3', maxlength: '1000' });
        area.value = n.text;
        const saveEdit = el('button', { class: 'btn btn-primary btn-small', type: 'button', text: 'Save' });
        saveEdit.addEventListener('click', async () => {
          const out = await run(saveEdit, rowMsg, () => send('PUT', guildPath(guild.id, '/notes/' + n.id), { text: area.value }));
          if (out) loadNotes();
        });
        text.replaceWith(el('div', {}, [area, saveEdit]));
        edit.remove();
      });
      del.addEventListener('click', async () => {
        if (!confirm('Delete this note? This cannot be undone.')) return;
        const out = await run(del, rowMsg, () => send('DELETE', guildPath(guild.id, '/notes/' + n.id)), 'Deleted.');
        if (out) loadNotes();
      });
      notesList.appendChild(row);
    });
  }
  addBtn.addEventListener('click', async () => {
    const out = await run(addBtn, noteMsg, () => send('POST', guildPath(guild.id, '/notes'), { user: addId.value.trim(), text: addText.value }), 'Note added.');
    if (out) { addText.value = ''; loadNotes(); }
  });
  let timer = null;
  nq.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadNotes, 300); });
  notesPanel.appendChild(el('div', { class: 'note-add' }, [addId, addText, el('div', {}, [addBtn]), noteMsg]));
  notesPanel.appendChild(el('div', { style: 'margin:14px 0 10px' }, [nq]));
  notesPanel.appendChild(notesList);
  main.appendChild(notesPanel);
  loadNotes();

  const am = data.automod;
  const amPanel = section('a-automod', 'AutoMod', 'Each type runs from 0 (off) to 10 (strictest). Changes take effect within a few seconds.');
  if (am.lockdown) amPanel.appendChild(el('div', { class: 'callout warn', text: 'A raid lockdown is running right now. End it in Discord with -automod raidend.' }));
  const sliders = {};
  Object.keys(AUTOMOD_NAMES).forEach(type => {
    const value = el('b', { class: 'level-value', text: am.levels[type] ? String(am.levels[type]) : 'Off' });
    const range = el('input', { type: 'range', min: '0', max: '10', step: '1', 'aria-label': AUTOMOD_NAMES[type] });
    range.value = am.levels[type];
    range.addEventListener('input', () => { value.textContent = range.value === '0' ? 'Off' : range.value; });
    sliders[type] = range;
    amPanel.appendChild(el('div', { class: 'level-row' }, [el('span', { text: AUTOMOD_NAMES[type] }), range, value]));
  });
  const logSel = select(data.channels.map(c => ({ id: c.id, name: '#' + c.name })), 'No log channel');
  logSel.value = am.log_channel || '';
  const amSave = el('button', { class: 'btn btn-primary', type: 'button', text: 'Save AutoMod' });
  const amMsg = status();
  amSave.addEventListener('click', () => run(amSave, amMsg, () => send('PUT', guildPath(guild.id, '/automod'), {
    levels: { spam: +sliders.spam.value, scam: +sliders.scam.value, raids: +sliders.raids.value },
    log_channel: logSel.value || null
  })));
  amPanel.appendChild(el('label', { class: 'field-label', text: 'Where AutoMod posts what it did' }));
  amPanel.appendChild(logSel);
  amPanel.appendChild(el('div', { style: 'margin-top:14px' }, [amSave]));
  amPanel.appendChild(amMsg);

  amPanel.appendChild(el('h4', { class: 'sub-head', text: 'Whitelist' }));
  amPanel.appendChild(el('p', { class: 'hint', text: 'AutoMod ignores these roles and members completely.' }));
  const wlChips = el('div', { class: 'chips' });
  const wlMsg = status();
  let wl = am.whitelist.slice();
  async function wlChange(id, kind, on, name) {
    const out = await run(null, wlMsg, () => send('PUT', guildPath(guild.id, '/automod/whitelist'), { id: id, kind: kind, on: on }));
    if (!out) return;
    if (on) wl.push({ id: id, kind: kind, name: name || id });
    else wl = wl.filter(x => x.id !== id);
    drawWl();
  }
  const wlRole = select([], 'Add a role...');
  const wlUser = textInput('', { placeholder: 'Member user ID', inputmode: 'numeric' });
  const wlAdd = el('button', { class: 'btn btn-outline', type: 'button', text: 'Add member' });
  function drawWl() {
    wlChips.replaceChildren();
    wl.forEach(x => wlChips.appendChild(chip((x.kind === 'role' ? '@' : '') + x.name, () => wlChange(x.id, x.kind, false))));
    if (!wl.length) wlChips.appendChild(el('span', { class: 'hint', text: 'Nobody is whitelisted.' }));
    wlRole.replaceChildren(el('option', { value: '', text: 'Add a role...' }));
    data.roles.filter(r => !wl.some(x => x.id === r.id)).forEach(r => wlRole.appendChild(el('option', { value: r.id, text: r.name })));
  }
  wlRole.addEventListener('change', () => {
    const r = data.roles.find(x => x.id === wlRole.value);
    if (r) wlChange(r.id, 'role', true, r.name);
  });
  wlAdd.addEventListener('click', () => { if (wlUser.value.trim()) { wlChange(wlUser.value.trim(), 'member', true); wlUser.value = ''; } });
  amPanel.appendChild(wlChips);
  amPanel.appendChild(el('div', { class: 'dash-row', style: 'margin-top:10px' }, [wlRole, wlUser, wlAdd]));
  amPanel.appendChild(wlMsg);
  drawWl();
  main.appendChild(amPanel);
}

async function startUser() {
  try {
    const me = await dashFetch('/api/me');
    showGuilds(me);
  } catch (e) {
    showLogin(e.loggedOut ? null : e.message, !e.loggedOut);
  }
}

async function initDashboard() {
  if (!dashRoot()) return;
  const params = new URLSearchParams(location.hash.slice(1));
  const ticket = params.get('ticket');
  const error = params.get('error');
  if (ticket || error) history.replaceState(null, '', location.pathname);

  if (error) {
    const reasons = {
      state: 'That login attempt expired or did not match. Please try again.',
      denied: 'Login was cancelled.',
      rate: 'Too many attempts. Wait a minute and try again.',
      busy: 'Too many people are logging in right now. Try again in a few minutes.',
      discord: 'Discord could not confirm your login. Please try again.'
    };
    return showLogin(reasons[error] || 'Login failed. Please try again.', true);
  }

  if (ticket) {
    try {
      const out = await dashFetch('/auth/session', { method: 'POST', body: JSON.stringify({ ticket }) });
      setToken(out.token);
      return showGuilds(out.user);
    } catch (e) {
      return showLogin(e.message, true);
    }
  }

  if (getToken()) return startUser();
  showLogin();
}

document.addEventListener('DOMContentLoaded', initDashboard);
