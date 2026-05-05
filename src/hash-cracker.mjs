'use strict';

const W = 860, H = 200;
const COLS = 53, ROWS = 7;
const CELL_W = 13, CELL_H = 16;
const GRID_X = 60, GRID_Y = 56;
const TOTAL = 60;
const T_INTRO = 1.2;
const T_OUTRO = 4.5;

const DARK = {
  bg:'#000000', bgGlow:'#001505',
  fg:'#00ff66', fgDim:'#0a8a3a',
  fgFaint:'#073d1c',
  warn:'#ffb000', err:'#ff4444',
  white:'#ffffff', accent:'#39d353',
  scan:'rgba(0,255,102,0.04)',
};
const LIGHT = {
  bg:'#0a1410', bgGlow:'#06120c', // light-mode still terminal-y but slightly lighter
  fg:'#00cc52', fgDim:'#0a8a3a',
  fgFaint:'#0a4a22',
  warn:'#d97706', err:'#cc2222',
  white:'#e6ffe9', accent:'#1a7f37',
  scan:'rgba(0,200,80,0.03)',
};

const cellX = c => GRID_X + c * CELL_W;
const cellY = r => GRID_Y + r * CELL_H;
const fmt = n => Math.round(n * 1000) / 1000;

function genContrib(seed) {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const g = [];
  for (let r = 0; r < ROWS; r++) {
    g[r] = [];
    for (let c = 0; c < COLS; c++) {
      const wave = Math.sin(c / 5) * 0.4 + 0.6;
      const wk = (r >= 1 && r <= 5) ? 1 : 0.55;
      const p = rnd() * wave * wk;
      let v = 0;
      if (p < 0.18) v = 0;
      else if (p < 0.36) v = 1;
      else if (p < 0.54) v = 2;
      else if (p < 0.72) v = 3;
      else v = 4;
      if (c > 16 && c < 22 && r > 1 && r < 5) v = Math.max(v, 3);
      if (c > 36 && c < 42 && r > 2 && r < 6) v = Math.max(v, 4);
      g[r][c] = v;
    }
  }
  return g;
}

const HEX = '0123456789abcdef';
function pickHex(s) {
  let x = s;
  const rnd = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  return () => HEX[Math.floor(rnd() * 16)];
}

function buildSVG(T, grid) {
  // Active cells
  const cells = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] > 0) cells.push({ r, c, lvl: grid[r][c] });

  // Random shuffle solve order (parallel mining feel)
  let s1 = 17;
  const rnd = () => { s1 = (s1 * 9301 + 49297) % 233280; return s1 / 233280; };
  const shuffled = cells.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const battleStart = T_INTRO;
  const battleEnd = TOTAL - T_OUTRO;
  const span = battleEnd - battleStart;

  for (let i = 0; i < shuffled.length; i++) {
    // distribute solveAt with mild easing so events feel paced
    shuffled[i].solveAt = battleStart + (i / shuffled.length) * span;
  }

  let out = '';
  out += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace">`;

  out += `<defs>`;
  out += `<style>svg{shape-rendering:crispEdges;}</style>`;
  out += `<filter id="g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="0.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  out += `<radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="${T.bg}" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.65"/></radialGradient>`;
  out += `<pattern id="scan" width="2" height="3" patternUnits="userSpaceOnUse"><rect width="2" height="1" fill="${T.scan}"/></pattern>`;
  // Filled block symbol (resolved cell)
  out += `<symbol id="blk" viewBox="0 0 1 1" overflow="visible"><rect width="1" height="1" fill="${T.fg}"/></symbol>`;
  out += `</defs>`;

  // Background pure black
  out += `<rect width="${W}" height="${H}" fill="${T.bg}"/>`;

  // Background hash rain (faint)
  out += renderHashRain(T);

  // Title bar
  out += renderTopBar(T);

  // Grid: hex chars cycling, then resolved blocks
  out += renderGrid(T, cells, shuffled);

  // Wireframe chain connecting solved blocks (sequential lines)
  out += renderChain(T, shuffled);

  // Side panel left: worker info
  out += renderSidePanel(T);

  // Side panel right: BTC + USD ticker
  out += renderTicker(T, shuffled);

  // Bottom log line
  out += renderLog(T, shuffled);

  // HASH FOUND floaters (only on every Nth cell to keep size down)
  out += renderFoundFloaters(T, shuffled);

  // HACK THE PLANET easter egg
  out += renderEasterEgg(T);

  // Connection lost banner
  out += renderEnding(T, battleEnd + 0.4);

  // Scanlines + vignette
  out += `<rect width="${W}" height="${H}" fill="url(#scan)" pointer-events="none"/>`;
  out += `<rect width="${W}" height="${H}" fill="url(#vig)" pointer-events="none"/>`;

  out += `</svg>`;
  return out;
}

function renderHashRain(T) {
  // Sparse hex chars in background
  let s = `<g opacity="0.18" font-size="9" fill="${T.fgFaint}">`;
  let q = 33;
  const rnd = () => { q = (q * 9301 + 49297) % 233280; return q / 233280; };
  for (let i = 0; i < 90; i++) {
    const x = rnd() * W;
    const y = 8 + rnd() * (H - 16);
    const ch = HEX[Math.floor(rnd() * 16)];
    const dur = 1 + rnd() * 3;
    const beg = -rnd() * dur;
    s += `<text x="${fmt(x)}" y="${fmt(y)}" opacity="0">${ch}<animate attributeName="opacity" values="0;0.6;0" dur="${fmt(dur)}s" begin="${fmt(beg)}s" repeatCount="indefinite"/></text>`;
  }
  s += `</g>`;
  return s;
}

function renderTopBar(T) {
  let s = `<g font-size="9" letter-spacing="1">`;
  // Title left
  s += `<text x="14" y="16" fill="${T.fg}" font-weight="900" letter-spacing="3" filter="url(#g)">▸ HASH_CRACKER</text>`;
  s += `<text x="14" y="28" fill="${T.fgDim}">github-contrib-runner v1.0.0</text>`;

  // Center: BLOCK + DIFFICULTY + TEMP + FAN
  const cx = W / 2;
  s += `<text x="${cx}" y="16" text-anchor="middle" fill="${T.fgDim}">BLOCK <tspan fill="${T.fg}">#`;
  // Animated block height number
  const h0 = 874000;
  s += `${h0}`;
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const t = T_INTRO + (i / steps) * (TOTAL - T_INTRO - T_OUTRO);
    s += `<set attributeName="textContent" to="${h0 + i * 11}" begin="${fmt(t)}s;${fmt(t + TOTAL)}s"/>`;
  }
  s += `<set attributeName="textContent" to="${h0}" begin="${fmt(TOTAL - 0.05)}s;${fmt(TOTAL * 2 - 0.05)}s"/>`;
  s += `</tspan>  │  DIFF <tspan fill="${T.fg}">86.4T</tspan>  │  TEMP <tspan fill="${T.warn}">71°C</tspan>  │  FAN <tspan fill="${T.fg}">84%</tspan></text>`;

  // HASHRATE label + sparkline
  s += `<text x="${cx - 100}" y="28" fill="${T.fgDim}">HASHRATE</text>`;
  s += `<text x="${cx - 50}" y="28" fill="${T.fg}" font-weight="900">142.7 TH/s</text>`;
  // Sparkline: 24 small bars oscillating in heights
  const sparkX = cx + 30, sparkY = 22;
  const bars = 24, bw = 1.8;
  let qq = 7;
  const rnd = () => { qq = (qq * 9301 + 49297) % 233280; return qq / 233280; };
  for (let i = 0; i < bars; i++) {
    const x = sparkX + i * (bw + 0.7);
    // base height + animated
    const baseH = 2 + rnd() * 6;
    const altH = 2 + rnd() * 6;
    const dur = 0.4 + rnd() * 0.4;
    s += `<rect x="${fmt(x)}" y="${sparkY}" width="${bw}" height="${fmt(baseH)}" fill="${T.fg}">`;
    s += `<animate attributeName="height" values="${fmt(baseH)};${fmt(altH)};${fmt(baseH)}" dur="${fmt(dur)}s" repeatCount="indefinite"/>`;
    s += `<animate attributeName="y" values="${fmt(sparkY + 8 - baseH)};${fmt(sparkY + 8 - altH)};${fmt(sparkY + 8 - baseH)}" dur="${fmt(dur)}s" repeatCount="indefinite"/>`;
    s += `</rect>`;
  }

  // Right: connection indicator
  s += `<text x="${W - 14}" y="16" text-anchor="end" fill="${T.fg}">●<animate attributeName="fill" values="${T.fg};${T.fg};${T.warn};${T.fg}" keyTimes="0;${fmt((TOTAL - T_OUTRO - 0.5) / TOTAL)};${fmt((TOTAL - T_OUTRO + 0.5) / TOTAL)};1" dur="${TOTAL}s" repeatCount="indefinite"/> ONLINE</text>`;
  s += `<text x="${W - 14}" y="28" text-anchor="end" fill="${T.fgDim}">stratum+tcp://3333</text>`;

  s += `</g>`;
  return s;
}

function renderGrid(T, cells, solved) {
  const px = CELL_W, py = CELL_H;
  let s = `<g font-size="11" font-weight="700" font-family="ui-monospace,Menlo,monospace">`;

  // Build a map for faster lookup of solveAt
  const solveMap = new Map();
  for (const sc of solved) solveMap.set(sc.r + ',' + sc.c, sc);

  // For each cell: a flickering hex char until solveAt, then a filled block
  let hi = 99;
  const rnd = () => { hi = (hi * 9301 + 49297) % 233280; return hi / 233280; };

  for (const cell of cells) {
    const x = cellX(cell.c) + px / 2;
    const y = cellY(cell.r) + py / 2 + 4;
    const sc = solveMap.get(cell.r + ',' + cell.c);
    const solveAt = sc ? sc.solveAt : 0;
    const solveN = solveAt / TOTAL;
    const dim = T.fgFaint;
    const med = T.fgDim;

    // Flickering hex character: cycle through 4 chars, hidden after solveAt
    const chars = [HEX[Math.floor(rnd() * 16)], HEX[Math.floor(rnd() * 16)], HEX[Math.floor(rnd() * 16)], HEX[Math.floor(rnd() * 16)]];
    const flickerDur = 0.5 + rnd() * 0.4;
    const flickerBeg = -rnd() * flickerDur;
    s += `<text x="${fmt(x)}" y="${fmt(y)}" text-anchor="middle" fill="${med}" opacity="${0.6 + rnd() * 0.3}">`;
    s += `${chars[0]}`;
    // Use <set> to swap glyphs
    const cycle = flickerDur;
    s += `<set attributeName="textContent" to="${chars[1]}" begin="${fmt(cycle * 0.25 + flickerBeg)}s" />`;
    s += `<set attributeName="textContent" to="${chars[2]}" begin="${fmt(cycle * 0.5 + flickerBeg)}s" />`;
    s += `<set attributeName="textContent" to="${chars[3]}" begin="${fmt(cycle * 0.75 + flickerBeg)}s" />`;
    // Hide after solveAt; reappear at loop end
    s += `<animate attributeName="opacity" values="${0.6 + rnd() * 0.3};${0.6 + rnd() * 0.3};0;0;${0.6 + rnd() * 0.3}" keyTimes="0;${fmt(solveN)};${fmt(Math.min(0.999, solveN + 0.005))};${fmt((TOTAL - 0.05) / TOTAL)};1" dur="${TOTAL}s" repeatCount="indefinite"/>`;
    s += `</text>`;

    // Solved block: appears at solveAt
    const bx = cellX(cell.c) + 1.5, by = cellY(cell.r) + 3;
    const bw = px - 3, bh = py - 6;
    s += `<rect x="${fmt(bx)}" y="${fmt(by)}" width="${fmt(bw)}" height="${fmt(bh)}" fill="${T.fg}" opacity="0">`;
    s += `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${fmt(solveN)};${fmt(Math.min(0.999, solveN + 0.003))};${fmt((TOTAL - 0.05) / TOTAL)};1" dur="${TOTAL}s" repeatCount="indefinite"/>`;
    s += `</rect>`;
    // White flash on solve
    s += `<rect x="${fmt(bx)}" y="${fmt(by)}" width="${fmt(bw)}" height="${fmt(bh)}" fill="${T.white}" opacity="0">`;
    s += `<animate attributeName="opacity" values="0;1;0" keyTimes="0;0.3;1" dur="0.25s" begin="${fmt(solveAt)}s;${fmt(solveAt + TOTAL)}s" fill="freeze"/>`;
    s += `</rect>`;
  }

  s += `</g>`;
  return s;
}

function renderChain(T, solved) {
  // Connect solved blocks in order with thin green lines (wireframe blockchain)
  // To control size, sample every 4th block.
  let s = `<g stroke="${T.fg}" stroke-width="0.5" fill="none" opacity="0.5">`;
  const sample = solved.filter((_, i) => i % 4 === 0);
  for (let i = 1; i < sample.length; i++) {
    const a = sample[i - 1], b = sample[i];
    const x1 = cellX(a.c) + CELL_W / 2;
    const y1 = cellY(a.r) + CELL_H / 2;
    const x2 = cellX(b.c) + CELL_W / 2;
    const y2 = cellY(b.r) + CELL_H / 2;
    const showAt = b.solveAt / TOTAL;
    s += `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" opacity="0">`;
    s += `<animate attributeName="opacity" values="0;0;0.6;0.6;0" keyTimes="0;${fmt(showAt)};${fmt(Math.min(0.999, showAt + 0.005))};${fmt((TOTAL - 0.05) / TOTAL)};1" dur="${TOTAL}s" repeatCount="indefinite"/>`;
    s += `</line>`;
  }
  s += `</g>`;
  return s;
}

function renderSidePanel(T) {
  // Left side: worker info, stratum address — vertical orientation outside grid
  let s = `<g font-size="7" letter-spacing="0.5" fill="${T.fgDim}">`;
  s += `<text x="6" y="62" fill="${T.fg}" font-weight="700">WORKER</text>`;
  s += `<text x="6" y="72">0xWendell</text>`;
  s += `<text x="6" y="80">.runner</text>`;

  s += `<text x="6" y="98" fill="${T.fg}" font-weight="700">POOL</text>`;
  s += `<text x="6" y="108">stratum</text>`;
  s += `<text x="6" y="116">+tcp://</text>`;
  s += `<text x="6" y="124">3333</text>`;

  s += `<text x="6" y="142" fill="${T.fg}" font-weight="700">SHARES</text>`;
  s += `<text x="6" y="152" fill="${T.fg}">`;
  s += `0`;
  for (let i = 1; i <= 12; i++) {
    const t = T_INTRO + (i / 12) * (TOTAL - T_INTRO - T_OUTRO);
    s += `<set attributeName="textContent" to="${i * 47}" begin="${fmt(t)}s;${fmt(t + TOTAL)}s"/>`;
  }
  s += `<set attributeName="textContent" to="0" begin="${fmt(TOTAL - 0.05)}s;${fmt(TOTAL * 2 - 0.05)}s"/>`;
  s += `</text>`;
  s += `</g>`;
  return s;
}

function renderTicker(T, solved) {
  // Right side: BTC + USD subindo conforme blocos resolvidos
  // We update at every Nth solve (12 steps total)
  let s = `<g font-size="7" letter-spacing="0.5" fill="${T.fgDim}">`;
  s += `<text x="${W - 6}" y="62" text-anchor="end" fill="${T.fg}" font-weight="700">BTC MINED</text>`;
  s += `<text x="${W - 6}" y="74" text-anchor="end" fill="${T.fg}" font-size="11" font-weight="900" filter="url(#g)">`;
  s += `₿0.00000`;
  const stepsB = 16;
  for (let i = 1; i <= stepsB; i++) {
    const t = T_INTRO + (i / stepsB) * (TOTAL - T_INTRO - T_OUTRO);
    const v = (i * 0.00021).toFixed(5);
    s += `<set attributeName="textContent" to="₿${v}" begin="${fmt(t)}s;${fmt(t + TOTAL)}s"/>`;
  }
  s += `<set attributeName="textContent" to="₿0.00000" begin="${fmt(TOTAL - 0.05)}s;${fmt(TOTAL * 2 - 0.05)}s"/>`;
  s += `</text>`;

  s += `<text x="${W - 6}" y="86" text-anchor="end" fill="${T.fgDim}">USD</text>`;
  s += `<text x="${W - 6}" y="96" text-anchor="end" fill="${T.fg}" font-size="9" font-weight="700">`;
  s += `$0.00`;
  for (let i = 1; i <= stepsB; i++) {
    const t = T_INTRO + (i / stepsB) * (TOTAL - T_INTRO - T_OUTRO);
    const v = (i * 13.65).toFixed(2);
    s += `<set attributeName="textContent" to="$${v}" begin="${fmt(t)}s;${fmt(t + TOTAL)}s"/>`;
  }
  s += `<set attributeName="textContent" to="$0.00" begin="${fmt(TOTAL - 0.05)}s;${fmt(TOTAL * 2 - 0.05)}s"/>`;
  s += `</text>`;

  // Difficulty / shares display
  s += `<text x="${W - 6}" y="118" text-anchor="end" fill="${T.fg}" font-weight="700">UPTIME</text>`;
  s += `<text x="${W - 6}" y="128" text-anchor="end" fill="${T.fg}">`;
  s += `00:00`;
  for (let i = 1; i <= 12; i++) {
    const t = (i / 12) * TOTAL;
    const sec = Math.floor(t);
    const ss = String(sec % 60).padStart(2, '0');
    const mm = String(Math.floor(sec / 60)).padStart(2, '0');
    s += `<set attributeName="textContent" to="${mm}:${ss}" begin="${fmt(t)}s;${fmt(t + TOTAL)}s"/>`;
  }
  s += `<set attributeName="textContent" to="00:00" begin="${fmt(TOTAL - 0.05)}s;${fmt(TOTAL * 2 - 0.05)}s"/>`;
  s += `</text>`;

  s += `<text x="${W - 6}" y="146" text-anchor="end" fill="${T.fg}" font-weight="700">REWARD</text>`;
  s += `<text x="${W - 6}" y="156" text-anchor="end" fill="${T.fg}">3.125 ₿</text>`;

  s += `</g>`;
  return s;
}

function renderLog(T, solved) {
  // Bottom log line: cycles thru fake mining log entries
  let s = `<g font-size="8" font-family="ui-monospace,Menlo,monospace">`;
  // Cursor-like prefix
  const lines = [
    "▸ scanning nonce range 0x00000000—0xffffffff",
    "▸ submitted share: accepted by pool",
    "▸ ✓ HASH FOUND: 00000000a7f3e2b1c8d4...",
    "▸ retargeting difficulty +0.04T",
    "▸ ASIC #2 throttling (temp threshold)",
    "▸ ✓ HASH FOUND: 00000000c1f9a3e7b2d5...",
    "▸ stratum subscribed mining.notify",
    "▸ ✓ HASH FOUND: 0000000045eaf2c1789a...",
    "▸ submitted share: accepted by pool",
    "▸ syncing mempool: 47281 tx",
    "▸ ✓ HASH FOUND: 00000000ee82d4615abc...",
    "▸ pool latency 23ms",
  ];
  const y = H - 14;
  s += `<text x="14" y="${y}" fill="${T.fg}">`;
  s += escapeXML(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const t = (i / lines.length) * TOTAL * 0.95;
    s += `<set attributeName="textContent" to="${escapeXML(lines[i])}" begin="${fmt(t)}s;${fmt(t + TOTAL)}s"/>`;
  }
  s += `<set attributeName="textContent" to="${escapeXML(lines[0])}" begin="${fmt(TOTAL - 0.05)}s;${fmt(TOTAL * 2 - 0.05)}s"/>`;
  s += `</text>`;

  // Cursor blink
  s += `<text x="14" y="${y - 12}" fill="${T.fg}" font-size="10">>_<animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite"/></text>`;

  s += `</g>`;
  return s;
}

function escapeXML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderFoundFloaters(T, solved) {
  // Only on every 8th solve to keep size down
  let s = `<g font-size="7" font-weight="700" fill="${T.fg}">`;
  for (let i = 0; i < solved.length; i += 8) {
    const sc = solved[i];
    const x = cellX(sc.c) + CELL_W / 2;
    const y = cellY(sc.r);
    s += `<text x="${fmt(x)}" y="${fmt(y)}" text-anchor="middle" opacity="0">✓ FOUND`;
    s += `<animate attributeName="opacity" values="0;1;0" keyTimes="0;0.3;1" dur="0.8s" begin="${fmt(sc.solveAt)}s;${fmt(sc.solveAt + TOTAL)}s" fill="freeze"/>`;
    s += `<animate attributeName="y" values="${fmt(y)};${fmt(y - 8)}" dur="0.8s" begin="${fmt(sc.solveAt)}s;${fmt(sc.solveAt + TOTAL)}s" fill="freeze"/>`;
    s += `</text>`;
  }
  s += `</g>`;
  return s;
}

function renderEasterEgg(T) {
  // HACK THE PLANET appears for 0.6s with glitch around mid-loop
  const t = TOTAL * 0.62;
  let s = `<g opacity="0">`;
  s += `<animate attributeName="opacity" values="0;0;1;0;1;0;0" keyTimes="0;${fmt(t / TOTAL)};${fmt((t + 0.1) / TOTAL)};${fmt((t + 0.2) / TOTAL)};${fmt((t + 0.3) / TOTAL)};${fmt((t + 0.5) / TOTAL)};1" dur="${TOTAL}s" repeatCount="indefinite"/>`;
  s += `<text x="${W / 2}" y="${H / 2 + 30}" text-anchor="middle" font-size="14" font-weight="900" fill="${T.fg}" letter-spacing="6" filter="url(#g)">HACK THE PLANET</text>`;
  // RGB-split shadow
  s += `<text x="${W / 2 - 1}" y="${H / 2 + 30}" text-anchor="middle" font-size="14" font-weight="900" fill="${T.err}" letter-spacing="6" opacity="0.6">HACK THE PLANET</text>`;
  s += `<text x="${W / 2 + 1}" y="${H / 2 + 30}" text-anchor="middle" font-size="14" font-weight="900" fill="${T.warn}" letter-spacing="6" opacity="0.6">HACK THE PLANET</text>`;
  s += `</g>`;
  return s;
}

function renderEnding(T, tEnd) {
  const cx = W / 2, cy = H / 2;
  const k1 = fmt(tEnd / TOTAL);
  const k2 = fmt((tEnd + 0.3) / TOTAL);
  const k3 = fmt((TOTAL - 0.5) / TOTAL);
  const k4 = fmt((TOTAL - 0.1) / TOTAL);
  let s = `<g opacity="0">`;
  s += `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${k1};${k2};${k3};${k4};1" dur="${TOTAL}s" repeatCount="indefinite"/>`;
  // Backdrop scanline
  s += `<rect x="${cx - 160}" y="${cy - 22}" width="320" height="44" fill="${T.bg}" opacity="0.9"/>`;
  s += `<rect x="${cx - 160}" y="${cy - 22}" width="320" height="44" fill="none" stroke="${T.err}" stroke-width="1" stroke-dasharray="4 2"/>`;
  // [!] icon
  s += `<text x="${cx - 130}" y="${cy + 4}" font-size="14" font-weight="900" fill="${T.err}">[!]</text>`;
  // Main text
  s += `<text x="${cx + 20}" y="${cy - 3}" text-anchor="middle" font-size="11" font-weight="900" fill="${T.err}" letter-spacing="3">CONNECTION LOST</text>`;
  // Subtext with animated dots
  s += `<text x="${cx + 20}" y="${cy + 13}" text-anchor="middle" font-size="8" fill="${T.fg}" letter-spacing="2">RECONNECTING<tspan>`;
  s += `<animate attributeName="textContent" values=".  ;.. ;...; ..;  .;.  " dur="0.9s" repeatCount="indefinite"/>`;
  s += `</tspan></text>`;
  s += `</g>`;
  return s;
}

function buildAdaptive(grid) {
  const tok = {
    bg:'var(--bg)', bgGlow:'var(--bgGlow)',
    fg:'var(--fg)', fgDim:'var(--fgDim)', fgFaint:'var(--fgFaint)',
    warn:'var(--warn)', err:'var(--err)',
    white:'var(--white)', accent:'var(--accent)',
    scan:'var(--scan)',
  };
  const svg = buildSVG(tok, grid);
  const style = `<style>
:root{--bg:${LIGHT.bg};--bgGlow:${LIGHT.bgGlow};--fg:${LIGHT.fg};--fgDim:${LIGHT.fgDim};--fgFaint:${LIGHT.fgFaint};--warn:${LIGHT.warn};--err:${LIGHT.err};--white:${LIGHT.white};--accent:${LIGHT.accent};--scan:${LIGHT.scan};}
@media (prefers-color-scheme: dark){:root{--bg:${DARK.bg};--bgGlow:${DARK.bgGlow};--fg:${DARK.fg};--fgDim:${DARK.fgDim};--fgFaint:${DARK.fgFaint};--warn:${DARK.warn};--err:${DARK.err};--white:${DARK.white};--accent:${DARK.accent};--scan:${DARK.scan};}}
</style>`;
  return svg.replace('<defs>', `<defs>${style}`);
}

export { buildAdaptive as renderHashCrackerGrid };
