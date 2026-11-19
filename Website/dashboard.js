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
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function showLogin(message, isError) {
  const root = dashClear();
  if (message) root.appendChild(el('div', { class: 'callout' + (isError ? ' warn' : ''), text: message }));
  root.appendChild(el('div', { class: 'dash-panel' }, [
    el('h3', { text: 'Log in to continue' }),
    el('p', { class: 'hint', text: 'Nexus only asks for your Discord username and avatar. It never sees your password.' }),
    el('a', { class: 'btn btn-primary', href: DASH_API + '/auth/login', text: 'Log in with Discord' })
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
  const p = el('p', { class: 'empty', text: text });
  root.appendChild(p);
  return p;
}

function failInto(root, e, keep) {
  if (e.loggedOut) { showLogin(e.message, true); return; }
  root.replaceChildren.apply(root, keep.concat([el('div', { class: 'callout warn', text: e.message })]));
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
  data.guilds.forEach(g => {
    const meta = el('span', { class: 'gmeta', text: g.members + ' members' });
    if (g.admin) meta.appendChild(el('span', { class: 'gtag', text: 'Admin' }));
    const card = el('button', { class: 'guild-card', type: 'button' }, [
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
  const mine = el('button', { class: 'choice-card', type: 'button' }, [
    el('span', { class: 'choice-icon', text: '👤' }),
    el('span', {}, [
      el('b', { text: 'My dashboard' }),
      el('small', { text: 'Your profile, activity stats and moderation history in this server.' })
    ])
  ]);
  mine.addEventListener('click', () => showProfile(user, guild));
  options.appendChild(mine);

  const admin = el('button', { class: 'choice-card' + (guild.admin ? '' : ' locked'), type: 'button' }, [
    el('span', { class: 'choice-icon', text: guild.admin ? '⚙️' : '🔒' }),
    el('span', {}, [
      el('b', { text: 'Admin dashboard' }),
      el('small', { text: guild.admin ? 'Change how Nexus works in this server.' : 'Only the server owner and members with Administrator can open this.' })
    ])
  ]);
  if (guild.admin) admin.addEventListener('click', () => showSettings(user, guild));
  else admin.disabled = true;
  options.appendChild(admin);
  root.appendChild(options);
}

function statTile(value, label) {
  return el('div', { class: 'stat-tile' }, [el('b', { text: String(value) }), el('span', { text: label })]);
}

function caseRow(c, detailed) {
  const head = el('div', { class: 'case-head' }, [
    el('span', { class: 'case-type', text: c.type }),
    el('code', { text: c.case }),
    el('span', { class: 'case-when', text: fmtDay(c.time) })
  ]);
  const row = el('div', { class: 'case-row' }, [head]);
  if (detailed) {
    row.appendChild(el('p', { text: 'Reason: ' + c.reason }));
    if (c.duration) row.appendChild(el('p', { class: 'case-dur', text: 'Duration: ' + c.duration }));
  }
  return row;
}

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
  const m = data.member;
  const s = data.stats;

  const pic = safeIcon(m.avatar);
  const badges = el('div', { class: 'profile-badges' });
  if (m.is_owner) badges.appendChild(el('span', { class: 'gtag', text: 'Owner' }));
  else if (m.is_admin) badges.appendChild(el('span', { class: 'gtag', text: 'Admin' }));
  root.appendChild(el('div', { class: 'dash-panel profile' }, [
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
  ]));

  const more = el('button', { class: 'btn btn-primary', type: 'button', text: 'See all my stats' });
  more.addEventListener('click', () => showStats(user, guild));
  root.appendChild(el('div', { class: 'dash-panel' }, [
    el('h3', { text: 'Your stats' }),
    el('p', { class: 'hint', text: 'Activity from the last 30 days. Nexus counts messages, it never saves what they say.' }),
    el('div', { class: 'stat-grid' }, [
      statTile(s.messages_7d, 'messages this week'),
      statTile(s.messages_30d, 'messages in 30 days'),
      statTile(fmtMinutes(s.voice_minutes_30d), 'in voice, 30 days'),
      statTile(s.rank ? '#' + s.rank : '-', s.rank ? 'of ' + s.ranked_members + ' by messages' : 'no messages yet')
    ]),
    el('div', { style: 'margin-top:14px' }, [more])
  ]));

  const c = data.cases;
  const casePanel = el('div', { class: 'dash-panel' }, [el('h3', { text: 'Your moderation history' })]);
  if (!c.total) {
    casePanel.appendChild(el('p', { class: 'hint', text: 'Nothing on record. Nice and clean.' }));
  } else {
    casePanel.appendChild(el('p', { class: 'hint', text: c.total + (c.total === 1 ? ' case' : ' cases') + ' on record in this server.' }));
    const chips = el('div', { class: 'case-chips' });
    Object.keys(c.types).forEach(t => chips.appendChild(el('span', { class: 'gtag', text: t + ' × ' + c.types[t] })));
    casePanel.appendChild(chips);
    const list = el('div', { class: 'case-list' });
    c.latest.forEach(x => list.appendChild(caseRow(x, false)));
    casePanel.appendChild(list);
    const toggle = el('button', { class: 'btn btn-outline', type: 'button', text: 'Show all details' });
    let open = false;
    toggle.addEventListener('click', async () => {
      if (open) {
        list.replaceChildren();
        c.latest.forEach(x => list.appendChild(caseRow(x, false)));
        toggle.textContent = 'Show all details';
        open = false;
        return;
      }
      toggle.disabled = true;
      toggle.textContent = 'Loading...';
      try {
        const full = await dashFetch(guildPath(guild.id, '/me/cases'));
        list.replaceChildren();
        full.cases.forEach(x => list.appendChild(caseRow(x, true)));
        toggle.textContent = 'Hide details';
        open = true;
      } catch (e) {
        if (e.loggedOut) return showLogin(e.message, true);
        toggle.textContent = 'Show all details';
        casePanel.appendChild(el('p', { class: 'dash-msg bad', text: e.message }));
      }
      toggle.disabled = false;
    });
    casePanel.appendChild(el('div', { style: 'margin-top:14px' }, [toggle]));
  }
  root.appendChild(casePanel);
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

async function showSettings(user, guild) {
  const root = dashClear();
  const back = backButton(guild.name, () => showChooser(user, guild));
  root.appendChild(userBar(user));
  root.appendChild(back);
  const wait = loading(root, 'Loading settings...');

  let data;
  try {
    data = await dashFetch(guildPath(guild.id, '/settings'));
  } catch (e) {
    return failInto(root, e, [userBar(user), back]);
  }
  wait.remove();
  root.appendChild(el('div', { class: 'dash-title' }, [guildIcon(data.guild), el('h2', { text: data.guild.name })]));

  const input = el('input', { class: 'search', type: 'text', maxlength: '5', value: data.prefix, 'aria-label': 'Prefix', autocomplete: 'off', spellcheck: 'false' });
  const save = el('button', { class: 'btn btn-primary', type: 'button', text: 'Save' });
  const msg = el('div', { class: 'dash-msg', role: 'status' });

  save.addEventListener('click', async () => {
    save.disabled = true;
    msg.className = 'dash-msg';
    msg.textContent = 'Saving...';
    try {
      const out = await dashFetch(guildPath(guild.id, '/prefix'), {
        method: 'PUT',
        body: JSON.stringify({ prefix: input.value })
      });
      input.value = out.prefix;
      msg.className = 'dash-msg ok';
      msg.textContent = 'Saved. Nexus now answers to ' + out.prefix + ' in this server.';
    } catch (e) {
      if (e.loggedOut) { showLogin(e.message, true); return; }
      msg.className = 'dash-msg bad';
      msg.textContent = e.message;
    }
    save.disabled = false;
  });

  root.appendChild(el('div', { class: 'dash-panel' }, [
    el('h3', { text: 'Prefix' }),
    el('p', { class: 'hint', text: 'The character or short word that goes before commands. Up to 5 characters, no spaces. Mentioning Nexus always works too.' }),
    el('div', { class: 'dash-row' }, [input, save]),
    msg
  ]));
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
