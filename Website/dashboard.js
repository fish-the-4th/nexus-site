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
  const panel = el('div', { class: 'dash-panel' }, [
    el('h3', { text: 'Log in to continue' }),
    el('p', { class: 'hint', text: 'Nexus only asks for your Discord username and avatar. It never sees your password.' }),
    el('a', { class: 'btn btn-primary', href: DASH_API + '/auth/login', text: 'Log in with Discord' })
  ]);
  root.appendChild(panel);
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

function guildIcon(guild) {
  const box = el('span', { class: 'gicon' });
  const pic = safeIcon(guild.icon);
  if (pic) box.appendChild(el('img', { src: pic, alt: '' }));
  else box.textContent = (guild.name || '?').charAt(0).toUpperCase();
  return box;
}

async function showGuilds(user) {
  const root = dashClear();
  root.appendChild(userBar(user));
  root.appendChild(el('p', { class: 'empty', text: 'Loading your servers...' }));
  let data;
  try {
    data = await dashFetch('/api/guilds');
  } catch (e) {
    if (e.loggedOut) return showLogin(e.message, true);
    root.replaceChildren(userBar(user), el('div', { class: 'callout warn', text: e.message }));
    return;
  }
  root.replaceChildren(userBar(user));
  root.appendChild(el('h3', { text: 'Choose a server', style: 'margin-bottom:12px' }));
  if (!data.guilds.length) {
    root.appendChild(el('div', { class: 'callout', text: 'No servers found. You need the Manage Server permission in a server that has Nexus.' }));
    return;
  }
  const list = el('div', { class: 'guild-list' });
  data.guilds.forEach(g => {
    const card = el('button', { class: 'guild-card', type: 'button' }, [
      guildIcon(g),
      el('span', {}, [
        el('span', { class: 'gname', text: g.name }),
        el('span', { class: 'gmeta', text: g.members + ' members' })
      ])
    ]);
    card.addEventListener('click', () => showGuild(user, g.id));
    list.appendChild(card);
  });
  root.appendChild(list);
}

async function showGuild(user, guildId) {
  const root = dashClear();
  root.appendChild(userBar(user));
  const back = el('button', { class: 'dash-back', type: 'button', text: '← All servers' });
  back.addEventListener('click', () => showGuilds(user));
  root.appendChild(back);
  root.appendChild(el('p', { class: 'empty', text: 'Loading settings...' }));

  let data;
  try {
    data = await dashFetch('/api/guilds/' + encodeURIComponent(guildId) + '/settings');
  } catch (e) {
    if (e.loggedOut) return showLogin(e.message, true);
    root.replaceChildren(userBar(user), back, el('div', { class: 'callout warn', text: e.message }));
    return;
  }

  root.replaceChildren(userBar(user), back);
  root.appendChild(el('div', { class: 'dash-title' }, [guildIcon(data.guild), el('h2', { text: data.guild.name })]));

  const input = el('input', { class: 'search', type: 'text', maxlength: '5', value: data.prefix, 'aria-label': 'Prefix', autocomplete: 'off', spellcheck: 'false' });
  const save = el('button', { class: 'btn btn-primary', type: 'button', text: 'Save' });
  const msg = el('div', { class: 'dash-msg', role: 'status' });

  save.addEventListener('click', async () => {
    save.disabled = true;
    msg.className = 'dash-msg';
    msg.textContent = 'Saving...';
    try {
      const out = await dashFetch('/api/guilds/' + encodeURIComponent(guildId) + '/prefix', {
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
