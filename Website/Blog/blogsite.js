const NB = (() => {
  const FONTS = {
    sans: 'Default',
    serif: 'Serif',
    mono: 'Monospace',
    georgia: 'Georgia',
    trebuchet: 'Trebuchet',
    verdana: 'Verdana',
    tahoma: 'Tahoma',
    impact: 'Impact',
    rounded: 'Rounded',
    hand: 'Handwritten'
  };
  const PALETTE = ['#5865F2', '#4fc3e0', '#3ba55d', '#f0b232', '#ed4245', '#8b5cf6', '#f472b6', '#94a3b8', '#f0882f', '#2dd4bf'];
  const TONES = { info: 'Info', success: 'Success', warn: 'Warning', danger: 'Danger', note: 'Note' };
  const TONE_ICON = { info: 'ℹ️', success: '✅', warn: '⚠️', danger: '⛔', note: '💡' };
  const CHARTS = { bar: 'Bars', stacked: 'Stacked bars', hbar: 'Sideways bars', line: 'Line', area: 'Area', pie: 'Pie', donut: 'Donut' };
  const SVGNS = 'http://www.w3.org/2000/svg';

  const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*(,\s*(0|1|0?\.\d+)\s*)?\)|transparent)$/i;
  const isColor = v => COLOR_RE.test(String(v || '').trim());
  const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };

  const STYLE_RULES = {
    'color': isColor,
    'background-color': isColor,
    'font-size': v => /^\d{1,3}(\.\d+)?(px|em|rem|%)$/.test(v),
    'font-weight': v => /^(normal|bold|[1-9]00)$/.test(v),
    'font-style': v => /^(normal|italic)$/.test(v),
    'text-decoration': v => /^(none|underline|line-through)( (underline|line-through))*$/.test(v),
    'text-decoration-line': v => /^(none|underline|line-through)( (underline|line-through))*$/.test(v),
    'text-align': v => /^(left|center|right|justify|start|end)$/.test(v),
    'line-height': v => /^\d(\.\d{1,2})?$/.test(v)
  };
  const TAGS = {
    P: 'p', DIV: 'div', BR: 'br', B: 'strong', STRONG: 'strong', I: 'em', EM: 'em', U: 'u', S: 's', STRIKE: 's', DEL: 's',
    SPAN: 'span', FONT: 'span', A: 'a', UL: 'ul', OL: 'ol', LI: 'li', H1: 'h2', H2: 'h2', H3: 'h3', H4: 'h4',
    BLOCKQUOTE: 'blockquote', CODE: 'code', SUB: 'sub', SUP: 'sup', MARK: 'mark'
  };
  const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'MATH', 'TEXTAREA', 'SELECT', 'BUTTON', 'INPUT', 'IMG', 'VIDEO', 'AUDIO', 'LINK', 'META', 'TITLE', 'HEAD', 'FORM', 'CANVAS']);

  function cleanStyle(str) {
    const out = [];
    String(str || '').split(';').forEach(part => {
      const i = part.indexOf(':');
      if (i < 0) return;
      const k = part.slice(0, i).trim().toLowerCase();
      const v = part.slice(i + 1).trim().replace(/\s*!important$/i, '');
      if (STYLE_RULES[k] && STYLE_RULES[k](v)) out.push(k + ':' + v);
    });
    return out.join(';');
  }

  function safeHref(v) {
    const s = String(v || '').trim();
    if (!s) return '';
    if (/^https?:\/\/[^\s]+$/i.test(s) || /^mailto:[^\s]+$/i.test(s)) return s;
    if (/^[#./a-z0-9_-][^\s:]*$/i.test(s) && !/^\/\//.test(s)) return s;
    return '';
  }

  function cleanInto(src, dst) {
    Array.from(src.childNodes).forEach(n => {
      if (n.nodeType === 3) { dst.appendChild(document.createTextNode(n.nodeValue)); return; }
      if (n.nodeType !== 1) return;
      const name = n.tagName.toUpperCase();
      if (DROP.has(name)) return;
      const tag = TAGS[name];
      if (!tag) { cleanInto(n, dst); return; }
      const e = document.createElement(tag);
      let st = cleanStyle(n.getAttribute('style'));
      if (name === 'FONT' && isColor(n.getAttribute('color'))) st = (st ? st + ';' : '') + 'color:' + n.getAttribute('color').trim();
      if (st) e.setAttribute('style', st);
      const f = n.getAttribute('data-f');
      if (f && FONTS[f]) e.setAttribute('data-f', f);
      if (tag === 'a') {
        const href = safeHref(n.getAttribute('href'));
        if (href) {
          e.setAttribute('href', href);
          if (/^https?:/i.test(href)) { e.setAttribute('target', '_blank'); e.setAttribute('rel', 'noopener noreferrer'); }
        }
      }
      cleanInto(n, e);
      dst.appendChild(e);
    });
  }

  function richFrag(html) {
    const frag = document.createDocumentFragment();
    if (!html) return frag;
    const doc = new DOMParser().parseFromString('<!DOCTYPE html><body>' + String(html), 'text/html');
    cleanInto(doc.body, frag);
    return frag;
  }

  function cleanHTML(html) {
    const box = document.createElement('div');
    box.appendChild(richFrag(html));
    return box.innerHTML;
  }

  function textOf(html) {
    const box = document.createElement('div');
    box.appendChild(richFrag(html));
    return box.textContent || '';
  }

  function h(tag, attrs, kids) {
    const e = document.createElement(tag);
    for (const k in (attrs || {})) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v);
    }
    (kids || []).forEach(c => { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }

  function s(tag, attrs, kids) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in (attrs || {})) {
      if (attrs[k] == null) continue;
      if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(c => { if (c) e.appendChild(c); });
    return e;
  }

  function fileName(v) {
    return String(v || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 80);
  }

  function slugify(v) {
    return String(v || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  }

  function assetPath(src, post, root) {
    const v = String(src || '').trim();
    if (!v) return '';
    if (/^(blob:|data:image\/|https:\/\/)/i.test(v)) return v;
    if (v.indexOf('/') >= 0) {
      const parts = v.split('/').map(x => x.replace(/[^A-Za-z0-9._-]+/g, '-')).filter(x => x && !/^\.+$/.test(x));
      return parts.length ? root + 'Assets/' + parts.map(encodeURIComponent).join('/') : '';
    }
    return root + 'Assets/Blog/' + encodeURIComponent(slugify(post.slug) || 'post') + '/' + encodeURIComponent(fileName(v));
  }

  function formatDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return '';
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  function blockText(b) {
    if (!b) return '';
    if (b.type === 'text' || b.type === 'callout' || b.type === 'quote') return textOf(b.html);
    if (b.type === 'table') return (b.rows || []).map(r => (r || []).map(textOf).join(' ')).join(' ');
    if (b.type === 'image') return b.caption || '';
    if (b.type === 'code') return b.text || '';
    return '';
  }

  function readingTime(post) {
    const words = (post.blocks || []).map(blockText).join(' ').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  }

  function boxStyle(el, box) {
    if (!box) return;
    if (isColor(box.bg)) el.style.background = box.bg;
    if (isColor(box.color)) el.style.color = box.color;
    const bw = num(box.bw, 0, 12, 0);
    if (bw && isColor(box.border)) el.style.border = bw + 'px ' + (box.bs === 'dashed' || box.bs === 'dotted' ? box.bs : 'solid') + ' ' + box.border;
    const r = num(box.radius, 0, 60, 0);
    if (r) el.style.borderRadius = r + 'px';
    const p = num(box.pad, 0, 80, 0);
    if (p) el.style.padding = p + 'px';
    const fs = num(box.size, 0, 96, 0);
    if (fs >= 8) el.style.fontSize = fs + 'px';
    const lh = num(box.lh, 0, 3, 0);
    if (lh >= 1) el.style.lineHeight = String(lh);
    if (box.font && FONTS[box.font]) el.setAttribute('data-f', box.font);
    if (/^(left|center|right|justify)$/.test(box.align || '')) el.style.textAlign = box.align;
    if (box.shadow) el.classList.add('bp-shadow');
    if (box.glass) el.classList.add('bp-glass');
  }

  function rich(b, key, ctx, cls) {
    const e = h('div', { class: 'bp-rich' + (cls ? ' ' + cls : '') });
    e.appendChild(richFrag(b[key]));
    if (ctx.decorate) ctx.decorate('rich', e, b, key);
    return e;
  }

  function plain(tag, b, key, ctx, cls, ph) {
    const e = h(tag, { class: cls, text: b[key] || '' });
    if (ph) e.setAttribute('data-ph', ph);
    if (ctx.decorate) ctx.decorate('plain', e, b, key);
    return e;
  }

  function niceTicks(min, max, count) {
    if (!(max > min)) { max = min + 1; }
    const raw = (max - min) / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const r = raw / mag;
    const step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag;
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
    return { lo, hi, ticks };
  }

  function fmt(v, b) {
    const n = Number(v) || 0;
    let t;
    const a = Math.abs(n);
    if (b.compact !== false && a >= 1e9) t = (n / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
    else if (b.compact !== false && a >= 1e6) t = (n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    else if (b.compact !== false && a >= 1e4) t = (n / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K';
    else t = String(Math.round(n * 100) / 100);
    return (b.prefix || '') + t + (b.suffix || '');
  }

  function chartData(b) {
    const labels = (Array.isArray(b.labels) ? b.labels : []).map(x => String(x == null ? '' : x));
    const series = (Array.isArray(b.series) ? b.series : []).map((sr, i) => ({
      name: String((sr && sr.name) || 'Series ' + (i + 1)),
      color: isColor(sr && sr.color) ? sr.color : PALETTE[i % PALETTE.length],
      values: labels.map((_, j) => { const n = Number(sr && sr.values && sr.values[j]); return Number.isFinite(n) ? n : 0; })
    }));
    const colors = labels.map((_, j) => (Array.isArray(b.colors) && isColor(b.colors[j])) ? b.colors[j] : PALETTE[j % PALETTE.length]);
    return { labels, series, colors };
  }

  function smoothPath(pts) {
    if (pts.length < 3) return 'M' + pts.map(p => p.join(',')).join('L');
    let d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += 'C' + c1.map(n => n.toFixed(1)).join(',') + ' ' + c2.map(n => n.toFixed(1)).join(',') + ' ' + p2.map(n => n.toFixed(1)).join(',');
    }
    return d;
  }

  function chartSVG(b, width) {
    const kind = CHARTS[b.kind] ? b.kind : 'bar';
    const { labels, series, colors } = chartData(b);
    const W = Math.max(220, Math.round(width || 640)), H = num(b.height, 160, 560, 300);
    const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'bp-svg', role: 'img', 'aria-label': b.title || 'Chart' });
    if (!labels.length || !series.length) {
      svg.appendChild(s('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', class: 'bp-ax', text: 'Add some data to see the chart' }));
      return svg;
    }
    const showVals = !!b.values;
    if (kind === 'pie' || kind === 'donut') {
      const vals = series[0].values.map(v => Math.max(0, v));
      const total = vals.reduce((a, v) => a + v, 0) || 1;
      const cx = W / 2, cy = H / 2, R = Math.min(H / 2 - 12, 200), r0 = kind === 'donut' ? R * 0.6 : 0;
      let a0 = -Math.PI / 2;
      vals.forEach((v, i) => {
        const frac = v / total;
        if (frac <= 0) return;
        const a1 = a0 + frac * Math.PI * 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const p = (r, a) => (cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2);
        let d;
        if (frac >= 0.9999) {
          d = 'M' + p(R, 0) + 'A' + R + ',' + R + ' 0 1 1 ' + p(R, Math.PI) + 'A' + R + ',' + R + ' 0 1 1 ' + p(R, 0) + 'Z';
          if (r0) d += 'M' + p(r0, 0) + 'A' + r0 + ',' + r0 + ' 0 1 0 ' + p(r0, Math.PI) + 'A' + r0 + ',' + r0 + ' 0 1 0 ' + p(r0, 0) + 'Z';
        } else {
          d = 'M' + p(R, a0) + 'A' + R + ',' + R + ' 0 ' + large + ' 1 ' + p(R, a1);
          d += r0 ? 'L' + p(r0, a1) + 'A' + r0 + ',' + r0 + ' 0 ' + large + ' 0 ' + p(r0, a0) + 'Z' : 'L' + cx + ',' + cy + 'Z';
        }
        const path = s('path', { d, fill: colors[i], class: 'bp-mark', 'fill-rule': 'evenodd' }, [s('title', { text: labels[i] + ': ' + fmt(v, b) + ' (' + Math.round(frac * 100) + '%)' })]);
        svg.appendChild(path);
        if (showVals && frac > 0.05) {
          const am = (a0 + a1) / 2, rr = r0 ? (R + r0) / 2 : R * 0.64;
          svg.appendChild(s('text', { x: (cx + rr * Math.cos(am)).toFixed(1), y: (cy + rr * Math.sin(am) + 4).toFixed(1), 'text-anchor': 'middle', class: 'bp-val-in', text: Math.round(frac * 100) + '%' }));
        }
        a0 = a1;
      });
      if (kind === 'donut' && b.center) {
        svg.appendChild(s('text', { x: cx, y: cy + 8, 'text-anchor': 'middle', class: 'bp-center', text: String(b.center).slice(0, 14) }));
      }
      return svg;
    }

    const stacked = kind === 'stacked';
    const horiz = kind === 'hbar';
    let lo = 0, hi = 0;
    if (stacked) {
      labels.forEach((_, j) => {
        let pos = 0, neg = 0;
        series.forEach(sr => { const v = sr.values[j]; if (v >= 0) pos += v; else neg += v; });
        hi = Math.max(hi, pos); lo = Math.min(lo, neg);
      });
    } else {
      series.forEach(sr => sr.values.forEach(v => { hi = Math.max(hi, v); lo = Math.min(lo, v); }));
    }
    if (kind === 'line' && b.zero === false) {
      const all = series.flatMap(sr => sr.values);
      lo = Math.min.apply(null, all); hi = Math.max.apply(null, all);
    }
    const t = niceTicks(lo, hi, horiz ? 5 : Math.max(3, Math.round(H / 70)));

    if (horiz) {
      const longest = Math.max.apply(null, labels.map(l => l.length));
      const padL = Math.min(200, 16 + longest * 7), padR = showVals ? 54 : 20, padT = 8, padB = 26;
      const pw = W - padL - padR, ph = H - padT - padB;
      const xs = v => padL + (v - t.lo) / (t.hi - t.lo) * pw;
      if (b.grid !== false) t.ticks.forEach(v => svg.appendChild(s('line', { x1: xs(v), x2: xs(v), y1: padT, y2: padT + ph, class: 'bp-grid' })));
      t.ticks.forEach(v => svg.appendChild(s('text', { x: xs(v), y: H - 8, 'text-anchor': 'middle', class: 'bp-ax', text: fmt(v, b) })));
      const band = ph / labels.length, gap = band * 0.22, bh = (band - gap) / series.length;
      labels.forEach((lab, j) => {
        const y0 = padT + j * band + gap / 2;
        svg.appendChild(s('text', { x: padL - 10, y: y0 + (band - gap) / 2 + 4, 'text-anchor': 'end', class: 'bp-ax bp-lab', text: lab }));
        series.forEach((sr, i) => {
          const v = sr.values[j], x1 = xs(Math.min(0, v)), x2 = xs(Math.max(0, v));
          svg.appendChild(s('rect', { x: x1.toFixed(1), y: (y0 + i * bh).toFixed(1), width: Math.max(1, x2 - x1).toFixed(1), height: Math.max(1, bh - 2).toFixed(1), rx: Math.min(6, bh / 3).toFixed(1), fill: sr.color, class: 'bp-mark' }, [s('title', { text: (series.length > 1 ? sr.name + ', ' : '') + lab + ': ' + fmt(v, b) })]));
          if (showVals) svg.appendChild(s('text', { x: (x2 + 6).toFixed(1), y: (y0 + i * bh + bh / 2 + 4).toFixed(1), class: 'bp-val', text: fmt(v, b) }));
        });
      });
      return svg;
    }

    const yl = t.ticks.map(v => fmt(v, b));
    const padL = Math.max(34, 12 + Math.max.apply(null, yl.map(x => x.length)) * 7), padR = 14, padT = showVals ? 22 : 12, padB = 30;
    const pw = W - padL - padR, ph = H - padT - padB;
    const ys = v => padT + ph - (v - t.lo) / (t.hi - t.lo) * ph;
    t.ticks.forEach((v, i) => {
      if (b.grid !== false || v === 0) svg.appendChild(s('line', { x1: padL, x2: W - padR, y1: ys(v), y2: ys(v), class: v === 0 ? 'bp-grid bp-zero' : 'bp-grid' }));
      svg.appendChild(s('text', { x: padL - 8, y: ys(v) + 4, 'text-anchor': 'end', class: 'bp-ax', text: yl[i] }));
    });
    const step = Math.max(1, Math.ceil(labels.length / Math.floor(pw / 56)));

    if (kind === 'line' || kind === 'area') {
      const xs = j => labels.length === 1 ? padL + pw / 2 : padL + j / (labels.length - 1) * pw;
      labels.forEach((lab, j) => { if (j % step === 0) svg.appendChild(s('text', { x: xs(j), y: H - 9, 'text-anchor': 'middle', class: 'bp-ax', text: lab })); });
      series.forEach((sr, i) => {
        const pts = sr.values.map((v, j) => [xs(j), ys(v)]);
        const d = b.smooth ? smoothPath(pts) : 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');
        if (kind === 'area') {
          const gid = 'g' + Math.random().toString(36).slice(2, 8);
          svg.appendChild(s('defs', {}, [s('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, [
            s('stop', { offset: '0%', 'stop-color': sr.color, 'stop-opacity': 0.42 }), s('stop', { offset: '100%', 'stop-color': sr.color, 'stop-opacity': 0.02 })
          ])]));
          const base = ys(Math.max(t.lo, Math.min(0, t.hi)));
          svg.appendChild(s('path', { d: d + 'L' + pts[pts.length - 1][0].toFixed(1) + ',' + base.toFixed(1) + 'L' + pts[0][0].toFixed(1) + ',' + base.toFixed(1) + 'Z', fill: 'url(#' + gid + ')' }));
        }
        svg.appendChild(s('path', { d, fill: 'none', stroke: sr.color, 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
        pts.forEach((p, j) => {
          svg.appendChild(s('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: labels.length > 24 ? 2.5 : 4, fill: sr.color, class: 'bp-dot' }, [s('title', { text: (series.length > 1 ? sr.name + ', ' : '') + labels[j] + ': ' + fmt(sr.values[j], b) })]));
          if (showVals && (labels.length <= 16 || j % step === 0)) svg.appendChild(s('text', { x: p[0].toFixed(1), y: (p[1] - 10).toFixed(1), 'text-anchor': 'middle', class: 'bp-val', text: fmt(sr.values[j], b) }));
        });
      });
      return svg;
    }

    const band = pw / labels.length, gap = band * (labels.length > 12 ? 0.18 : 0.28);
    const bw = stacked ? band - gap : (band - gap) / series.length;
    labels.forEach((lab, j) => {
      const x0 = padL + j * band + gap / 2;
      if (j % step === 0) svg.appendChild(s('text', { x: (padL + j * band + band / 2).toFixed(1), y: H - 9, 'text-anchor': 'middle', class: 'bp-ax', text: lab }));
      let pos = 0, neg = 0;
      series.forEach((sr, i) => {
        const v = sr.values[j];
        let a, z, x;
        if (stacked) {
          if (v >= 0) { a = pos; z = pos + v; pos = z; } else { a = neg + v; z = neg; neg = a; }
          x = x0;
        } else { a = Math.min(0, v); z = Math.max(0, v); x = x0 + i * bw; }
        const y1 = ys(z), y2 = ys(a);
        svg.appendChild(s('rect', { x: x.toFixed(1), y: y1.toFixed(1), width: Math.max(1, bw - (stacked ? 0 : 2)).toFixed(1), height: Math.max(1, y2 - y1).toFixed(1), rx: Math.min(6, bw / 4).toFixed(1), fill: sr.color, class: 'bp-mark' }, [s('title', { text: (series.length > 1 ? sr.name + ', ' : '') + lab + ': ' + fmt(v, b) })]));
        if (showVals && !stacked) svg.appendChild(s('text', { x: (x + bw / 2).toFixed(1), y: (v >= 0 ? y1 - 6 : y2 + 14).toFixed(1), 'text-anchor': 'middle', class: 'bp-val', text: fmt(v, b) }));
      });
      if (showVals && stacked) svg.appendChild(s('text', { x: (x0 + bw / 2).toFixed(1), y: (ys(pos) - 6).toFixed(1), 'text-anchor': 'middle', class: 'bp-val', text: fmt(pos + neg, b) }));
    });
    return svg;
  }

  function legend(b) {
    const { labels, series, colors } = chartData(b);
    const pie = b.kind === 'pie' || b.kind === 'donut';
    const items = pie ? labels.map((l, i) => [l, colors[i], fmt(series[0] ? series[0].values[i] : 0, b)]) : series.map(sr => [sr.name, sr.color, '']);
    if (b.legend === false || (!pie && items.length < 2)) return null;
    return h('div', { class: 'bp-legend' }, items.map(([l, c, v]) => {
      const sw = h('i');
      sw.style.background = c;
      return h('span', {}, [sw, l, v ? h('b', { text: v }) : null]);
    }));
  }

  const R = {
    text: (b, ctx) => rich(b, 'html', ctx),
    callout: (b, ctx) => {
      const tone = TONES[b.tone] ? b.tone : 'info';
      const wrap = h('div', { class: 'bp-callout tone-' + tone });
      const ico = plain('span', b, 'icon', ctx, 'bp-callout-ico');
      if (!b.icon) ico.textContent = ctx.decorate ? '' : TONE_ICON[tone];
      if (!b.icon && ctx.decorate) ico.setAttribute('data-ph', TONE_ICON[tone]);
      if (b.icon || !b.noIcon) wrap.appendChild(ico);
      wrap.appendChild(rich(b, 'html', ctx));
      return wrap;
    },
    quote: (b, ctx) => {
      const q = h('blockquote', { class: 'bp-quote' }, [rich(b, 'html', ctx)]);
      if (b.cite || ctx.decorate) q.appendChild(plain('cite', b, 'cite', ctx, 'bp-cite', 'Who said it (optional)'));
      return q;
    },
    image: (b, ctx) => {
      const fig = h('figure', { class: 'bp-figure' });
      const src = ctx.img(b.src);
      if (src) {
        const img = h('img', { src, alt: b.alt || '', loading: 'lazy', decoding: 'async' });
        const H = num(b.h, 0, 900, 0);
        if (H) { img.style.height = H + 'px'; img.style.objectFit = b.fit === 'contain' ? 'contain' : 'cover'; }
        const r = num(b.radius, 0, 60, 14);
        img.style.borderRadius = r + 'px';
        fig.appendChild(img);
      } else {
        fig.appendChild(h('div', { class: 'bp-img-empty', text: ctx.decorate ? 'Click or drop an image here' : '' }));
      }
      if (b.caption || ctx.decorate) fig.appendChild(plain('figcaption', b, 'caption', ctx, 'bp-caption', 'Add a caption (optional)'));
      if (ctx.decorate) ctx.decorate('image', fig, b);
      return fig;
    },
    chart: (b, ctx) => {
      const fig = h('figure', { class: 'bp-chart' });
      if (b.title || ctx.decorate) fig.appendChild(plain('figcaption', b, 'title', ctx, 'bp-chart-title', 'Chart title'));
      let svg = chartSVG(b);
      fig.appendChild(svg);
      let lastW = 0;
      const fit = () => {
        const w = Math.round(fig.clientWidth - 36);
        if (w < 100 || Math.abs(w - lastW) < 4) return;
        lastW = w;
        const next = chartSVG(b, w);
        svg.replaceWith(next);
        svg = next;
      };
      if (window.ResizeObserver) new ResizeObserver(fit).observe(fig);
      requestAnimationFrame(fit);
      const lg = legend(b);
      if (lg) fig.appendChild(lg);
      if (b.note || ctx.decorate) fig.appendChild(plain('p', b, 'note', ctx, 'bp-chart-note', 'Source or note (optional)'));
      return fig;
    },
    table: (b, ctx) => {
      const rows = Array.isArray(b.rows) && b.rows.length ? b.rows : [['']];
      const cols = Math.max.apply(null, rows.map(r => (r || []).length)) || 1;
      const table = h('table', { class: 'bp-table' + (b.striped !== false ? ' striped' : '') + (b.lines === false ? ' nolines' : '') + (b.compact ? ' compact' : '') });
      const align = Array.isArray(b.align) ? b.align : [];
      const headBg = isColor(b.headBg) ? b.headBg : '';
      const headColor = isColor(b.headColor) ? b.headColor : '';
      rows.forEach((row, ri) => {
        const head = b.head !== false && ri === 0;
        const tr = h('tr');
        for (let ci = 0; ci < cols; ci++) {
          const th = head || (b.firstCol && ci === 0);
          const cell = h(th ? 'th' : 'td');
          if (/^(left|center|right)$/.test(align[ci] || '')) cell.style.textAlign = align[ci];
          if (head && headBg) cell.style.background = headBg;
          if (head && headColor) cell.style.color = headColor;
          cell.appendChild(richFrag((row || [])[ci] || ''));
          if (ctx.decorate) ctx.decorate('cell', cell, b, ri, ci);
          tr.appendChild(cell);
        }
        (head ? (table.tHead || table.createTHead()) : (table.tBodies[0] || table.appendChild(document.createElement('tbody')))).appendChild(tr);
      });
      return h('div', { class: 'bp-table-wrap' }, [table]);
    },
    divider: b => h('hr', { class: 'bp-hr ' + (/^(line|dashed|dots|glow)$/.test(b.kind || '') ? b.kind : 'glow') }),
    spacer: (b, ctx) => {
      const e = h('div', { class: 'bp-spacer' });
      e.style.height = num(b.h, 4, 400, 40) + 'px';
      if (ctx.decorate) e.setAttribute('data-ph', 'Space ' + num(b.h, 4, 400, 40) + 'px');
      return e;
    },
    button: (b, ctx) => {
      const href = safeHref(b.href);
      const a = h('a', { class: 'btn ' + (b.kind === 'outline' ? 'btn-outline' : 'btn-primary') + ' bp-btn' });
      if (href && !ctx.decorate) {
        a.setAttribute('href', href);
        if (/^https?:/i.test(href)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); }
      }
      a.appendChild(plain('span', b, 'label', ctx, '', 'Button text'));
      return h('div', { class: 'bp-btn-row' }, [a]);
    },
    code: (b, ctx) => {
      const pre = h('pre', { class: 'bp-code' });
      if (b.label || ctx.decorate) pre.appendChild(plain('span', b, 'label', ctx, 'bp-code-label', 'Label (optional)'));
      pre.appendChild(plain('code', b, 'text', ctx, '', 'Paste code or a command here'));
      return pre;
    },
    numbers: (b, ctx) => {
      const items = Array.isArray(b.items) ? b.items : [];
      return h('div', { class: 'bp-numbers' }, items.map((it, i) => {
        const tile = h('div', { class: 'bp-num' });
        const v = plain('b', it, 'v', ctx, '', '0');
        if (isColor(it.c)) v.style.color = it.c;
        tile.appendChild(v);
        tile.appendChild(plain('span', it, 'l', ctx, '', 'Label'));
        if (ctx.decorate) ctx.decorate('numitem', tile, b, i);
        return tile;
      }));
    }
  };

  function renderBlock(b, ctx) {
    const type = R[b.type] ? b.type : 'text';
    const wrap = h('div', { class: 'bp-block bp-t-' + type, 'data-id': b.id || '' });
    const w = num(b.w, 10, 100, 100);
    wrap.style.setProperty('--w', String(w));
    if (w < 100 && /^(left|center|right)$/.test(b.align || '')) wrap.setAttribute('data-align', b.align);
    if (/^(start|center|end|stretch)$/.test(b.valign || '')) wrap.style.alignSelf = b.valign === 'start' || b.valign === 'end' ? 'flex-' + b.valign : b.valign;
    const mt = num(b.mt, -60, 300, 0);
    if (mt) wrap.style.marginTop = mt + 'px';
    if (b.newRow) wrap.classList.add('bp-newrow');
    const inner = h('div', { class: 'bp-inner' });
    boxStyle(inner, b.box);
    inner.appendChild(R[type](b, ctx));
    wrap.appendChild(inner);
    if (ctx.decorate) ctx.decorate('block', wrap, b);
    return wrap;
  }

  function renderBody(post, ctx) {
    const body = h('div', { class: 'bp-body' });
    (post.blocks || []).forEach(b => {
      if (b && b.newRow) body.appendChild(h('div', { class: 'bp-break' }));
      body.appendChild(renderBlock(b, ctx));
    });
    return body;
  }

  function headingId(text, used) {
    const base = slugify(text) || 'section';
    let id = base, n = 2;
    while (used.has(id)) id = base + '-' + n++;
    used.add(id);
    return id;
  }

  function contents(body) {
    const heads = Array.from(body.querySelectorAll('.bp-rich h2, .bp-rich h3')).filter(x => (x.textContent || '').trim());
    if (heads.length < 2) return null;
    const used = new Set();
    const links = heads.map(x => {
      x.id = 'sec-' + headingId(x.textContent, used);
      return h('a', { href: '#' + x.id, class: x.tagName === 'H3' ? 'sub' : '', text: x.textContent.trim().slice(0, 80) });
    });
    const nav = h('nav', { class: 'bp-toc', 'aria-label': 'On this page' }, [h('small', { text: 'On this page' })].concat(links));
    if (window.IntersectionObserver) {
      const spy = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
        });
      }, { rootMargin: '0px 0px -70% 0px' });
      heads.forEach(x => spy.observe(x));
    }
    return nav;
  }

  function renderPost(post, ctx) {
    ctx = ctx || {};
    if (!ctx.img) ctx.img = src => assetPath(src, post, ctx.root || '');
    const art = h('article', { class: 'bp' });

    const head = h('header', { class: 'bp-head' });
    const cat = h('span', { class: 'bp-cat', text: post.category || '' });
    if (!post.category && !ctx.decorate) cat.hidden = true;
    head.appendChild(h('div', { class: 'bp-kicker' }, [
      cat,
      h('span', { class: 'bp-when', text: formatDate(post.date) || 'Date not set' }),
      h('span', { class: 'bp-when', text: readingTime(post) + ' min read' })
    ]));
    const title = h('h1', { class: 'bp-title', text: post.title || '' });
    if (ctx.decorate) { title.setAttribute('data-ph', 'Write a title'); ctx.decorate('title', title, post); }
    head.appendChild(title);
    if (post.excerpt || ctx.decorate) {
      const lead = h('p', { class: 'bp-lead', text: post.excerpt || '' });
      if (ctx.decorate) { lead.setAttribute('data-ph', 'A short summary. It shows under the title and on the blog list.'); ctx.decorate('lead', lead, post); }
      head.appendChild(lead);
    }

    const byline = h('div', { class: 'bp-byline' });
    const authors = (Array.isArray(post.authors) ? post.authors : []).filter(a => a && (a.name || a.avatar));
    const list = authors.length ? authors : [{ name: 'Nexus Team' }];
    list.forEach(a => {
      const src = ctx.img(a.avatar);
      const av = src ? h('img', { class: 'bp-av', src, alt: '', loading: 'lazy' }) : h('span', { class: 'bp-av bp-av-empty', text: (a.name || '?').trim().slice(0, 1).toUpperCase() });
      byline.appendChild(h('div', { class: 'bp-person' }, [av, h('div', {}, [h('b', { text: a.name || 'Someone' }), a.role ? h('small', { text: a.role }) : null])]));
    });
    if (post.updated && post.updated !== post.date) byline.appendChild(h('span', { class: 'bp-updated', text: 'Updated ' + formatDate(post.updated) }));
    if (ctx.decorate) ctx.decorate('side', byline, post);
    head.appendChild(byline);
    art.appendChild(head);

    const banner = h('div', { class: 'bp-banner' });
    const bsrc = ctx.img(post.banner);
    if (bsrc) {
      const img = h('img', { src: bsrc, alt: post.bannerAlt || '', decoding: 'async', fetchpriority: 'high' });
      const pos = /^(top|center|bottom)$/.test(post.bannerPos || '') ? post.bannerPos : 'center';
      img.style.objectPosition = 'center ' + pos;
      banner.appendChild(img);
    } else banner.classList.add('empty');
    if (isColor(post.bannerBg)) banner.style.background = post.bannerBg;
    const bh = num(post.bannerH, 160, 640, 0);
    if (bh) { banner.style.setProperty('--bh', bh + 'px'); banner.classList.add('fixed'); }
    if (ctx.decorate) ctx.decorate('banner', banner, post, cat);
    if (bsrc || ctx.decorate) art.appendChild(banner);

    const body = renderBody(post, ctx);
    if (ctx.decorate) ctx.decorate('body', body, post);
    const layout = h('div', { class: 'bp-layout' }, [h('div', { class: 'bp-main' }, [body])]);
    if (!ctx.decorate) {
      const toc = contents(body);
      if (toc) { layout.appendChild(toc); layout.classList.add('has-toc'); }
    }
    art.appendChild(layout);
    return art;
  }

  return { FONTS, PALETTE, TONES, TONE_ICON, CHARTS, isColor, num, cleanHTML, richFrag, textOf, h, slugify, fileName, assetPath, formatDate, readingTime, renderPost, renderBlock, renderBody, chartSVG, legend, chartData, safeHref };
})();

(() => {
  const SITE_ROOT = typeof ROOT === 'string' ? ROOT : '../../';
  const UP_DIR = (document.body && document.body.dataset.up) || '';
  const h = NB.h;

  async function getIndex() {
    try {
      const data = typeof loadJSON === 'function' ? await loadJSON('blog.json') : null;
      const list = data && Array.isArray(data.posts) ? data.posts : [];
      return list.filter(p => p && p.slug && p.title && !p.hidden).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    } catch (e) {
      return null;
    }
  }

  function postHref(p) {
    return UP_DIR + 'Blog/Posts/' + encodeURIComponent(NB.slugify(p.slug)) + '.html';
  }

  function parts(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return {
      day: String(+m[3]),
      wd: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      month: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    };
  }

  function byNames(p) {
    const authors = Array.isArray(p.authors) ? p.authors.filter(a => a && a.name) : [];
    if (!authors.length) return 'Nexus Team';
    if (authors.length === 1) return authors[0].name;
    if (authors.length === 2) return authors[0].name + ' and ' + authors[1].name;
    return authors[0].name + ' and ' + (authors.length - 1) + ' others';
  }

  function row(p, latest) {
    const img = NB.assetPath(p.banner, p, SITE_ROOT);
    const d = parts(p.date);
    return h('a', { class: 'blog-row' + (latest ? ' latest' : ''), href: postHref(p) }, [
      h('div', { class: 'blog-row-date' }, d ? [h('b', { text: d.day }), h('span', { text: d.wd })] : [h('span', { text: '—' })]),
      h('div', { class: 'blog-row-text' }, [
        h('div', { class: 'blog-meta' }, [
          latest ? h('span', { class: 'new', text: 'Latest' }) : null,
          p.category ? h('span', { class: 'cat', text: p.category }) : null,
          h('span', { text: 'By ' + byNames(p) })
        ]),
        h('h3', { text: p.title }),
        p.excerpt ? h('p', { text: p.excerpt }) : null,
        h('span', { class: 'blog-read', text: 'Read the post →' })
      ]),
      img ? h('div', { class: 'blog-row-img' }, [h('img', { src: img, alt: '', loading: latest ? 'eager' : 'lazy' })]) : null
    ]);
  }

  function soon(host) {
    host.replaceChildren(h('div', { class: 'soon' }, [
      h('b', { text: 'Coming soon' }),
      h('h2', { text: 'The blog is on its way' }),
      h('p', { text: 'Nothing posted yet. Write-ups will show up here when they are ready.' })
    ]));
  }

  function grouped(list, markLatest) {
    const wrap = h('div', { class: 'blog-list' });
    let month = null, group = null;
    list.forEach((p, i) => {
      const d = parts(p.date);
      const m = d ? d.month : 'Undated';
      if (m !== month) {
        month = m;
        group = h('div', { class: 'blog-group' });
        wrap.appendChild(h('section', { class: 'blog-month' }, [h('h2', { text: m }), group]));
      }
      group.appendChild(row(p, markLatest && i === 0));
    });
    return wrap;
  }

  async function indexPage(host) {
    const posts = await getIndex();
    if (!posts || !posts.length) { soon(host); return; }
    const cats = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));
    let cat = '';
    let q = '';
    const out = h('div');
    const draw = () => {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      const list = posts.filter(p => (!cat || p.category === cat) && words.every(w => (p.title + ' ' + (p.excerpt || '') + ' ' + (p.category || '')).toLowerCase().includes(w)));
      if (!list.length) { out.replaceChildren(h('p', { class: 'blog-empty', text: 'No posts match that.' })); return; }
      out.replaceChildren(grouped(list, !cat && !q));
      if (typeof reveal === 'function') reveal(out);
    };
    const tools = h('div', { class: 'blog-tools' });
    if (cats.length > 1) {
      const tabs = h('div', { class: 'blog-tabs', role: 'tablist', 'aria-label': 'Categories' });
      const btns = [''].concat(cats).map(c => {
        const b = h('button', { type: 'button', role: 'tab', class: 'blog-tab' + (c === '' ? ' on' : ''), 'aria-selected': c === '' ? 'true' : 'false', text: c || 'Everything' });
        b.addEventListener('click', () => {
          cat = c;
          btns.forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
          draw();
        });
        tabs.appendChild(b);
        return b;
      });
      tools.appendChild(tabs);
    }
    if (posts.length > 4) {
      const search = h('input', { type: 'search', class: 'blog-search', placeholder: 'Search posts', 'aria-label': 'Search posts' });
      search.addEventListener('input', () => { q = search.value; draw(); });
      tools.appendChild(search);
    }
    host.replaceChildren();
    if (tools.childNodes.length) host.appendChild(tools);
    host.appendChild(out);
    draw();
  }

  function progressBar(art) {
    const bar = h('div', { class: 'bp-progress', 'aria-hidden': 'true' }, [h('i')]);
    document.body.appendChild(bar);
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = art.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const done = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      bar.firstChild.style.transform = 'scaleX(' + done.toFixed(4) + ')';
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function shareRow(post) {
    const copy = h('button', { type: 'button', class: 'btn btn-outline bp-copy', text: 'Copy link' });
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href.split('#')[0]);
        copy.textContent = 'Link copied';
      } catch (e) {
        copy.textContent = 'Could not copy';
      }
      setTimeout(() => { copy.textContent = 'Copy link'; }, 1800);
    });
    return h('div', { class: 'bp-end' }, [
      h('p', {}, ['Thanks for reading', post.category ? h('span', { text: ' · ' + post.category }) : null]),
      copy
    ]);
  }

  async function postPage(host, dataEl) {
    let post;
    try { post = JSON.parse(dataEl.textContent); } catch (e) { post = null; }
    if (!post || typeof post !== 'object') { host.replaceChildren(h('p', { class: 'blog-empty', text: 'This post could not be loaded.' })); return; }
    const art = NB.renderPost(post, { root: SITE_ROOT });
    host.replaceChildren(h('a', { class: 'blog-back', href: UP_DIR + 'Blog/blog.html', text: '← All posts' }), art, shareRow(post));
    progressBar(art);
    const posts = await getIndex();
    if (posts && posts.length > 1) {
      const others = posts.filter(p => NB.slugify(p.slug) !== NB.slugify(post.slug));
      const same = others.filter(p => p.category && p.category === post.category);
      const pick = same.concat(others.filter(p => same.indexOf(p) < 0)).slice(0, 3);
      if (pick.length) host.appendChild(h('section', { class: 'bp-more' }, [h('h2', { text: 'Keep reading' }), h('div', { class: 'blog-group' }, pick.map(p => row(p, false)))]));
    }
  }

  const dataEl = document.getElementById('post-data');
  const postHost = document.getElementById('post-root');
  const indexHost = document.getElementById('blog-root');
  if (dataEl && postHost) postPage(postHost, dataEl);
  if (indexHost) indexPage(indexHost);
})();
