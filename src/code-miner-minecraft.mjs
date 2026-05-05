'use strict';

// ============================================================
// CONFIG
// ============================================================
const W = 860, H = 200;
const COLS = 53, ROWS = 7;
const CELL = 12, GAP = 1;
const GRID_X = 24, GRID_Y = 50;
const TOTAL = 60;
const T_INTRO = 1.5;
const T_OUTRO = 4;

// ============================================================
// THEMES — Minecraft colors stay consistent; only background hue swaps
// ============================================================
const DARK = {
  sky: '#1a3a5c', skyTop: '#0d1f30',
  grass: '#5a9943', grassTop: '#3d7a2c',
  dirt: '#6b4423',
  stone: '#5a5a5a', stoneDark: '#3e3e3e',
  cave: '#15171c',
  fg: '#e8e8e8', fgDim: '#9aa0a8',
  border: '#000',
  hudBg: '#3b3b3b', hudBgDark: '#1f1f1f',
  hudBorder: '#000',
  heart: '#dc2626',
  food: '#c87841',
  scan: 'rgba(0,0,0,0.10)',
};
const LIGHT = {
  sky: '#7ec0ee', skyTop: '#a8d8f5',
  grass: '#5a9943', grassTop: '#3d7a2c',
  dirt: '#8b5a2b',
  stone: '#7e7e7e', stoneDark: '#5a5a5a',
  cave: '#2a2226',
  fg: '#1f2328', fgDim: '#57606a',
  border: '#000',
  hudBg: '#3b3b3b', hudBgDark: '#1f1f1f',
  hudBorder: '#000',
  heart: '#dc2626',
  food: '#c87841',
  scan: 'rgba(0,0,0,0.05)',
};

// Block types — name, primary, secondary, accent
const BLOCKS = {
  dirt:      { c:'#8b5a2b', d:'#6b4423', a:'#5a3a1c' },
  cobble:    { c:'#7e7e7e', d:'#5a5a5a', a:'#3e3e3e' },
  coal:      { c:'#3a3a3a', d:'#1f1f1f', a:'#0a0a0a' },
  iron:      { c:'#d8c2a8', d:'#a08770', a:'#6e5d4a' },
  redstone:  { c:'#cc2222', d:'#8a1818', a:'#5a0e0e' },
  gold:      { c:'#fce96a', d:'#d4a82e', a:'#8a6c1c' },
  lapis:     { c:'#3858a8', d:'#1f3580', a:'#0e1c4a' },
  diamond:   { c:'#5cd5e8', d:'#2a9bb0', a:'#1a6675' },
  emerald:   { c:'#28b048', d:'#1a7a30', a:'#0e4a1c' },
};

// Lvl→ block weighted choice (deeper rows favored for rare drops)
function pickBlock(lvl, row, rnd) {
  // depth bonus: rows further down (higher row index) more likely rare
  const depth = row / (ROWS - 1); // 0..1
  const r = rnd();
  if (lvl === 1) {
    if (r < 0.55) return 'dirt';
    if (r < 0.85) return 'cobble';
    return 'coal';
  }
  if (lvl === 2) {
    if (r < 0.30) return 'cobble';
    if (r < 0.65) return 'coal';
    if (r < 0.85 + depth * 0.05) return 'iron';
    return 'redstone';
  }
  if (lvl === 3) {
    if (r < 0.30) return 'iron';
    if (r < 0.55) return 'redstone';
    if (r < 0.78) return 'gold';
    if (r < 0.92) return 'lapis';
    return 'diamond';
  }
  // lvl 4 — best drops, depth helps further
  if (r < 0.20) return 'gold';
  if (r < 0.40) return 'lapis';
  if (r < 0.70 + depth * 0.10) return 'diamond';
  return 'emerald';
}

const cellX = c => GRID_X + c * (CELL + GAP);
const cellY = r => GRID_Y + r * (CELL + GAP);
const fmt = n => Math.round(n * 1000) / 1000;

// ============================================================
// CONTRIB DATA
// ============================================================
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

// ============================================================
// MINECRAFT BLOCK SYMBOL — 12x12 with classic 3-tone shading
// ============================================================
// Top-left highlight, bottom-right shadow, center stipple
function blockSymbol(id, b) {
  // Pixel-art texture pattern: 12x12 (we'll render as overflow visible viewBox 12x12)
  // base color → c, dark borders → a, mid noise → d
  let s = `<symbol id="${id}" viewBox="0 0 12 12" overflow="visible">`;
  // base
  s += `<rect width="12" height="12" fill="${b.c}"/>`;
  // top highlight (lighter strip)
  s += `<rect width="12" height="2" fill="${b.c}" opacity="0.6"/>`;
  s += `<rect x="0" y="0" width="2" height="12" fill="${b.c}" opacity="0.4"/>`;
  // bottom-right shadow
  s += `<rect x="0" y="10" width="12" height="2" fill="${b.a}"/>`;
  s += `<rect x="10" y="0" width="2" height="12" fill="${b.a}"/>`;
  // mid-tone speckle pattern (deterministic 2-tone)
  const dots = [
    [3, 2], [5, 4], [8, 3], [2, 6], [7, 7], [4, 8], [9, 6], [6, 9], [3, 5],
  ];
  for (const [x, y] of dots) {
    s += `<rect x="${x}" y="${y}" width="1" height="1" fill="${b.d}"/>`;
  }
  // 1px outer border
  s += `<rect width="12" height="12" fill="none" stroke="#000" stroke-opacity="0.6" stroke-width="1"/>`;
  s += `</symbol>`;
  return s;
}

// Special diamond shimmer
function diamondSymbol(b) {
  let s = `<symbol id="b_diamond" viewBox="0 0 12 12" overflow="visible">`;
  s += `<rect width="12" height="12" fill="${b.c}"/>`;
  s += `<rect width="12" height="2" fill="${b.c}" opacity="0.6"/>`;
  s += `<rect x="0" y="0" width="2" height="12" fill="${b.c}" opacity="0.4"/>`;
  s += `<rect x="0" y="10" width="12" height="2" fill="${b.a}"/>`;
  s += `<rect x="10" y="0" width="2" height="12" fill="${b.a}"/>`;
  // diamond pattern: ◆
  const dots = [[3,3],[8,3],[3,8],[8,8],[5,5],[6,5],[5,6],[6,6]];
  for (const [x,y] of dots) s += `<rect x="${x}" y="${y}" width="1" height="1" fill="${b.d}"/>`;
  // shimmer
  s += `<rect x="2" y="2" width="2" height="1" fill="#fff" opacity="0.7"><animate attributeName="opacity" values="0;0.9;0" dur="2s" repeatCount="indefinite"/></rect>`;
  s += `<rect width="12" height="12" fill="none" stroke="#000" stroke-opacity="0.6" stroke-width="1"/>`;
  s += `</symbol>`;
  return s;
}

// ============================================================
// STEVE WITH DIAMOND ARMOR — 8x12 sprite
// Uses pixel rects. Two frames for walking.
// ============================================================
function steveSymbol(id, frame) {
  // 8 wide × 12 tall sprite of Steve with diamond armor
  // frame: 'A' or 'B' (legs alternate)
  let s = `<symbol id="${id}" viewBox="0 0 8 12" overflow="visible">`;
  // head (4x4)
  s += `<rect x="2" y="0" width="4" height="4" fill="#9d6647"/>`; // skin
  s += `<rect x="2" y="0" width="4" height="2" fill="#3a2410"/>`; // hair
  s += `<rect x="3" y="2" width="1" height="1" fill="#fff"/>`; // eye L
  s += `<rect x="4" y="2" width="1" height="1" fill="#fff"/>`; // eye R
  s += `<rect x="3" y="2" width="1" height="1" fill="#3858a8"/>`;
  s += `<rect x="4" y="2" width="1" height="1" fill="#3858a8"/>`;
  s += `<rect x="3" y="3" width="2" height="1" fill="#7a4a30"/>`; // mouth/beard
  // diamond chestplate (6 wide × 3 tall)
  s += `<rect x="1" y="4" width="6" height="3" fill="#5cd5e8"/>`;
  s += `<rect x="1" y="4" width="6" height="1" fill="#7ee0f0"/>`; // top highlight
  s += `<rect x="1" y="6" width="6" height="1" fill="#2a9bb0"/>`; // shadow
  s += `<rect x="3" y="5" width="2" height="1" fill="#2a9bb0"/>`; // emblem
  // arms
  if (frame === 'A') {
    s += `<rect x="0" y="4" width="1" height="3" fill="#5cd5e8"/>`; // left arm
    s += `<rect x="7" y="4" width="1" height="4" fill="#5cd5e8"/>`; // right arm raised (with pickaxe)
  } else {
    s += `<rect x="0" y="5" width="1" height="3" fill="#5cd5e8"/>`;
    s += `<rect x="7" y="5" width="1" height="3" fill="#5cd5e8"/>`;
  }
  // legs
  if (frame === 'A') {
    s += `<rect x="2" y="7" width="2" height="4" fill="#5cd5e8"/>`;
    s += `<rect x="4" y="7" width="2" height="3" fill="#5cd5e8"/>`;
    s += `<rect x="2" y="11" width="2" height="1" fill="#1f1f1f"/>`; // boot
    s += `<rect x="4" y="10" width="2" height="2" fill="#1f1f1f"/>`;
  } else {
    s += `<rect x="2" y="7" width="2" height="3" fill="#5cd5e8"/>`;
    s += `<rect x="4" y="7" width="2" height="4" fill="#5cd5e8"/>`;
    s += `<rect x="2" y="10" width="2" height="2" fill="#1f1f1f"/>`;
    s += `<rect x="4" y="11" width="2" height="1" fill="#1f1f1f"/>`;
  }
  s += `</symbol>`;
  return s;
}

// Pickaxe (independent, animated)
function pickaxeSymbol() {
  // 5x5 sprite — diagonal pick
  let s = `<symbol id="pick" viewBox="0 0 5 5" overflow="visible">`;
  s += `<rect x="0" y="0" width="2" height="1" fill="#5cd5e8"/>`;
  s += `<rect x="2" y="0" width="2" height="1" fill="#7ee0f0"/>`;
  s += `<rect x="0" y="1" width="3" height="1" fill="#2a9bb0"/>`;
  s += `<rect x="2" y="2" width="1" height="1" fill="#8b5a2b"/>`;
  s += `<rect x="3" y="3" width="1" height="1" fill="#8b5a2b"/>`;
  s += `<rect x="4" y="4" width="1" height="1" fill="#6b4423"/>`;
  s += `</symbol>`;
  return s;
}

// Creeper sprite (8x12)
function creeperSymbol() {
  let s = `<symbol id="creeper" viewBox="0 0 8 12" overflow="visible">`;
  // head
  s += `<rect x="1" y="0" width="6" height="5" fill="#5db04b"/>`;
  s += `<rect x="1" y="0" width="6" height="1" fill="#7dc46b"/>`; // hl
  s += `<rect x="1" y="4" width="6" height="1" fill="#3a7a30"/>`; // shadow
  // eyes
  s += `<rect x="2" y="1" width="1" height="2" fill="#000"/>`;
  s += `<rect x="5" y="1" width="1" height="2" fill="#000"/>`;
  // mouth
  s += `<rect x="3" y="2" width="1" height="2" fill="#000"/>`;
  s += `<rect x="4" y="2" width="1" height="2" fill="#000"/>`;
  s += `<rect x="3" y="4" width="2" height="1" fill="#000"/>`;
  // body
  s += `<rect x="2" y="5" width="4" height="4" fill="#5db04b"/>`;
  s += `<rect x="2" y="5" width="4" height="1" fill="#7dc46b"/>`;
  // legs
  s += `<rect x="2" y="9" width="1" height="3" fill="#5db04b"/>`;
  s += `<rect x="5" y="9" width="1" height="3" fill="#5db04b"/>`;
  s += `<rect x="2" y="11" width="1" height="1" fill="#3a7a30"/>`;
  s += `<rect x="5" y="11" width="1" height="1" fill="#3a7a30"/>`;
  s += `</symbol>`;
  return s;
}

// ============================================================
// BUILD
// ============================================================
function buildSVG(T, grid) {
  // Collect blocks (cells with v > 0)
  let s = 71;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  const blocks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = grid[r][c];
      if (v > 0) {
        const blockType = pickBlock(v, r, rnd);
        blocks.push({ r, c, v, type: blockType });
      }
    }
  }

  // Mining order: zig-zag with jumping (we'll just sort by column primarily, but add jitter)
  // Steve jumps to nearest block. Simulate with a greedy traversal.
  const visited = new Set();
  const order = [];
  let cur = { r: 3, c: 0 }; // spawn middle-left
  while (order.length < blocks.length) {
    let best = null, bestD = Infinity;
    for (const b of blocks) {
      const k = b.r + ',' + b.c;
      if (visited.has(k)) continue;
      // weighted distance: prefer near columns, slight pref to same row
      const d = Math.abs(b.c - cur.c) * 1 + Math.abs(b.r - cur.r) * 0.6;
      if (d < bestD) { bestD = d; best = b; }
    }
    if (!best) break;
    visited.add(best.r + ',' + best.c);
    order.push(best);
    cur = best;
  }

  const battleStart = T_INTRO;
  const battleEnd = TOTAL - T_OUTRO;
  const interval = (battleEnd - battleStart) / order.length;

  for (let i = 0; i < order.length; i++) {
    order[i].mineAt = battleStart + i * interval;
    order[i].breakAt = order[i].mineAt + interval * 0.55;
  }

  // Steve position keyframes: jumps with parabola simplified to 2-step (preposition + arrive)
  const stops = [{ t: 0, x: cellX(0), y: cellY(3) - 12 }];
  for (const b of order) {
    const tx = cellX(b.c) - 2; // steve stands left of block
    const ty = cellY(b.r) - 12; // sits on top of block
    stops.push({ t: Math.max(0.05, b.mineAt - interval * 0.3), x: tx, y: ty });
    stops.push({ t: b.breakAt, x: tx, y: ty });
  }
  stops.push({ t: battleEnd + 0.5, x: cellX(COLS - 1), y: cellY(3) - 12 });
  stops.push({ t: TOTAL, x: cellX(COLS - 1), y: cellY(3) - 12 });
  // dedupe
  stops.sort((a, b) => a.t - b.t);
  const ss = [];
  for (const sp of stops) {
    if (ss.length && Math.abs(ss[ss.length - 1].t - sp.t) < 0.005) ss[ss.length - 1] = sp;
    else ss.push(sp);
  }

  // Creeper events: 2 random moments mid-loop
  const creeperEvents = [
    { t: T_INTRO + (TOTAL - T_INTRO - T_OUTRO) * 0.35, dur: 3 },
    { t: T_INTRO + (TOTAL - T_INTRO - T_OUTRO) * 0.72, dur: 3 },
  ];

  let out = '';
  out += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace">`;

  // === DEFS ===
  out += `<defs>`;
  // pixelated rendering
  out += `<style>svg{shape-rendering:crispEdges;}</style>`;
  // Sky gradient
  out += `<linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">`;
  out += `<stop offset="0%" stop-color="${T.skyTop}"/><stop offset="100%" stop-color="${T.sky}"/>`;
  out += `</linearGradient>`;
  // Cave gradient (depth shading)
  out += `<linearGradient id="cave" x1="0" x2="0" y1="0" y2="1">`;
  out += `<stop offset="0%" stop-color="${T.cave}"/><stop offset="100%" stop-color="#000"/>`;
  out += `</linearGradient>`;
  // Block symbols
  for (const [k, b] of Object.entries(BLOCKS)) {
    if (k === 'diamond') out += diamondSymbol(b);
    else out += blockSymbol('b_' + k, b);
  }
  // Steve A/B
  out += steveSymbol('steveA', 'A');
  out += steveSymbol('steveB', 'B');
  out += pickaxeSymbol();
  out += creeperSymbol();
  out += `</defs>`;

  // === BACKGROUND: SKY ===
  out += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;

  // === GRASS LINE at top of grid ===
  const grassY = GRID_Y - 4;
  out += `<g>`;
  // grass strip
  out += `<rect x="0" y="${grassY}" width="${W}" height="3" fill="${T.grassTop}"/>`;
  out += `<rect x="0" y="${grassY + 3}" width="${W}" height="2" fill="${T.grass}"/>`;
  // dirt below grass to grid top
  out += `<rect x="0" y="${grassY + 5}" width="${W}" height="${GRID_Y - grassY - 5}" fill="${T.dirt}"/>`;
  // grass tufts
  for (let i = 0; i < 25; i++) {
    const x = (i * 37 + 15) % W;
    out += `<rect x="${x}" y="${grassY - 1}" width="1" height="2" fill="${T.grassTop}"/>`;
    out += `<rect x="${x + 2}" y="${grassY - 1}" width="1" height="1" fill="${T.grass}"/>`;
  }
  out += `</g>`;

  // === CAVE BACKGROUND beneath grid ===
  const caveY = GRID_Y;
  const caveH = (CELL + GAP) * ROWS;
  out += `<rect x="0" y="${caveY}" width="${W}" height="${caveH}" fill="url(#cave)"/>`;

  // Stone scattering in background (decorative)
  let bs = 211;
  const rnd2 = () => { bs = (bs * 9301 + 49297) % 233280; return bs / 233280; };
  out += `<g opacity="0.3">`;
  for (let i = 0; i < 35; i++) {
    const x = rnd2() * W;
    const y = caveY + rnd2() * caveH;
    const sz = 2 + Math.floor(rnd2() * 3);
    out += `<rect x="${fmt(x)}" y="${fmt(y)}" width="${sz}" height="${sz}" fill="${T.stoneDark}"/>`;
  }
  out += `</g>`;

  // Floor under blocks
  out += `<rect x="0" y="${caveY + caveH}" width="${W}" height="${H - caveY - caveH}" fill="#1a1014"/>`;
  out += `<rect x="0" y="${caveY + caveH}" width="${W}" height="2" fill="${T.stoneDark}"/>`;

  // === TITLE ===
  out += `<text x="${W / 2}" y="14" text-anchor="middle" font-size="13" font-weight="900" fill="#ffd83a" letter-spacing="3" stroke="#3a2a00" stroke-width="0.5">CODE MINER</text>`;
  out += `<text x="${W / 2}" y="22" text-anchor="middle" font-size="6" fill="${T.fgDim}" letter-spacing="3" opacity="0.7">github-contrib-runner</text>`;

  // === BLOCKS ===
  // Each block fades out (opacity 1 → 0) at its breakAt time, with subtle wobble before.
  for (const b of order) {
    const x = cellX(b.c), y = cellY(b.r);
    const dieN = b.breakAt / TOTAL;
    const wobN = b.mineAt / TOTAL;
    const sz = CELL;
    out += `<g>`;
    out += `<use href="#b_${b.type}" x="${x}" y="${y}" width="${sz}" height="${sz}">`;
    out += `<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${fmt(dieN)};${fmt(Math.min(0.999, dieN + 0.005))};${fmt((TOTAL - 0.05) / TOTAL)};1" dur="${TOTAL}s" repeatCount="indefinite"/>`;
    out += `</use>`;
    out += `</g>`;
  }

  // === BREAK PARTICLES ===
  // 2 particles per block (was 4); tinted by block color
  for (const b of order) {
    const x = cellX(b.c) + CELL / 2, y = cellY(b.r) + CELL / 2;
    const col = BLOCKS[b.type].c;
    const offs = [[-4,-4],[4,4]];
    for (const [dx, dy] of offs) {
      out += `<rect x="${x - 1}" y="${y - 1}" width="2" height="2" fill="${col}" opacity="0">`;
      out += `<animate attributeName="opacity" values="0;1;0" keyTimes="0;0.2;1" dur="0.45s" begin="${fmt(b.breakAt)}s;${fmt(b.breakAt + TOTAL)}s" fill="freeze"/>`;
      out += `<animateTransform attributeName="transform" type="translate" values="0,0;${dx},${dy}" dur="0.45s" begin="${fmt(b.breakAt)}s;${fmt(b.breakAt + TOTAL)}s" fill="freeze"/>`;
      out += `</rect>`;
    }
  }

  // === STEVE ===
  out += renderSteve(ss);

  // === CREEPER EVENTS ===
  for (const ev of creeperEvents) {
    out += renderCreeper(ev);
  }

  // === HUD: Hotbar + hearts + food ===
  out += renderHUD(T, order);

  // === GAME SAVED message ===
  out += renderSaved(T, battleEnd + 0.6);

  // === Subtle scanline ===
  out += `<rect width="${W}" height="${H}" fill="${T.scan}" pointer-events="none"/>`;

  out += `</svg>`;
  return out;
}

function renderSteve(stops) {
  const valsX = stops.map(s => fmt(s.x)).join(';');
  const valsY = stops.map(s => fmt(s.y)).join(';');
  const ks = stops.map(s => fmt(Math.min(1, Math.max(0, s.t / TOTAL)))).join(';');
  const sw = 8, sh = 12;
  let s = `<g>`;
  // Group that holds Steve's two frames + pickaxe — animates X/Y
  s += `<g>`;
  // Scale up: render at width 10 (so Steve is 10×15)
  // Frame A
  s += `<g><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.49;0.5;0.99;1" dur="0.4s" repeatCount="indefinite"/>`;
  s += `<use href="#steveA" x="0" y="0" width="${sw}" height="${sh}"/>`;
  // pickaxe in raised position (frame A)
  s += `<g transform="translate(7,1)">`;
  s += `<use href="#pick" x="0" y="0" width="5" height="5"/>`;
  s += `</g>`;
  s += `</g>`;

  s += `<g><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.49;0.5;0.99;1" dur="0.4s" repeatCount="indefinite"/>`;
  s += `<use href="#steveB" x="0" y="0" width="${sw}" height="${sh}"/>`;
  // pickaxe lowered (frame B)
  s += `<g transform="translate(8,4)">`;
  s += `<use href="#pick" x="0" y="0" width="5" height="5"/>`;
  s += `</g>`;
  s += `</g>`;

  s += `<animateTransform attributeName="transform" type="translate" values="${stops.map(s => `${fmt(s.x)},${fmt(s.y)}`).join(';')}" keyTimes="${ks}" dur="${TOTAL}s" repeatCount="indefinite"/>`;
  s += `</g>`;
  s += `</g>`;
  return s;
}

function renderCreeper(ev) {
  // Creeper appears from the right, walks toward Steve, hisses, then disappears
  const tStart = ev.t;
  const tEnd = ev.t + ev.dur;
  // Approach: x goes from W+10 to W*0.6
  let s = `<g opacity="0">`;
  s += `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${fmt(tStart / TOTAL)};${fmt((tStart + 0.2) / TOTAL)};${fmt((tEnd - 0.3) / TOTAL)};${fmt(tEnd / TOTAL)};1" dur="${TOTAL}s" repeatCount="indefinite"/>`;
  s += `<g>`;
  s += `<use href="#creeper" x="0" y="0" width="10" height="14"/>`;
  // hiss flash (white tint)
  s += `<rect x="0" y="0" width="10" height="14" fill="#fff" opacity="0">`;
  s += `<animate attributeName="opacity" values="0;0;0.6;0;0.6;0;0" keyTimes="0;${fmt((tEnd - 1.5) / TOTAL)};${fmt((tEnd - 1.2) / TOTAL)};${fmt((tEnd - 0.9) / TOTAL)};${fmt((tEnd - 0.6) / TOTAL)};${fmt((tEnd - 0.3) / TOTAL)};1" dur="${TOTAL}s" repeatCount="indefinite"/>`;
  s += `</rect>`;
  s += `<animateTransform attributeName="transform" type="translate" values="${W + 10},${cellY(2) - 4};${W * 0.6},${cellY(2) - 4};${W * 0.6},${cellY(2) - 4};${W + 10},${cellY(2) - 4}" keyTimes="0;0.4;0.8;1" dur="${ev.dur}s" begin="${fmt(tStart)}s;${fmt(tStart + TOTAL)}s" fill="freeze"/>`;
  s += `</g>`;
  s += `</g>`;
  return s;
}

function renderHUD(T, order) {
  let s = '';

  // ===== HOTBAR =====
  // Bottom center, classic Minecraft 9-slot hotbar
  const slots = 9;
  const slotSize = 16;
  const hbW = slots * slotSize;
  const hbX = (W - hbW) / 2;
  const hbY = H - slotSize - 6;

  s += `<g>`;
  // Outer border (dark)
  s += `<rect x="${hbX - 2}" y="${hbY - 2}" width="${hbW + 4}" height="${slotSize + 4}" fill="${T.hudBgDark}" stroke="#000" stroke-width="0.5"/>`;
  // Inner background (gray)
  s += `<rect x="${hbX}" y="${hbY}" width="${hbW}" height="${slotSize}" fill="${T.hudBg}"/>`;

  // Slot dividers
  for (let i = 0; i <= slots; i++) {
    s += `<line x1="${hbX + i * slotSize}" y1="${hbY}" x2="${hbX + i * slotSize}" y2="${hbY + slotSize}" stroke="${T.hudBgDark}" stroke-width="0.5"/>`;
  }
  // Slot inner highlight (top-left bevel)
  for (let i = 0; i < slots; i++) {
    const sx = hbX + i * slotSize + 1, sy = hbY + 1;
    s += `<rect x="${sx}" y="${sy}" width="${slotSize - 2}" height="1" fill="#5a5a5a" opacity="0.5"/>`;
    s += `<rect x="${sx}" y="${sy}" width="1" height="${slotSize - 2}" fill="#5a5a5a" opacity="0.5"/>`;
  }

  // Selected slot indicator (white border) — animates across slots
  const selVals = [];
  const selKs = [];
  // moves through slots over the loop
  for (let i = 0; i <= slots; i++) {
    selVals.push(hbX + (i % slots) * slotSize - 1);
    selKs.push(fmt(i / slots));
  }
  s += `<rect x="${hbX - 1}" y="${hbY - 1}" width="${slotSize + 2}" height="${slotSize + 2}" fill="none" stroke="#fff" stroke-width="1.5">`;
  s += `<animate attributeName="x" values="${selVals.join(';')}" keyTimes="${selKs.join(';')}" dur="${TOTAL}s" repeatCount="indefinite" calcMode="discrete"/>`;
  s += `</rect>`;

  // Inventory items: count distinct block types collected over time.
  // We pre-bucket order into 9 categories and reveal counts progressively.
  const tally = {};
  for (const b of order) {
    tally[b.type] = (tally[b.type] || 0) + 1;
  }
  const sortedTypes = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, slots).map(t => t[0]);

  // For each type, determine cumulative times of collection
  const typeCollectTimes = {};
  for (const t of sortedTypes) typeCollectTimes[t] = [];
  for (const b of order) {
    if (typeCollectTimes[b.type]) typeCollectTimes[b.type].push(b.breakAt);
  }

  for (let i = 0; i < sortedTypes.length; i++) {
    const t = sortedTypes[i];
    const sx = hbX + i * slotSize + (slotSize - 10) / 2;
    const sy = hbY + (slotSize - 10) / 2;
    const symbolId = (t === 'diamond') ? 'b_diamond' : 'b_' + t;

    // Block icon appears at first collection
    const firstAt = typeCollectTimes[t][0];
    s += `<use href="#${symbolId}" x="${sx}" y="${sy}" width="10" height="10" opacity="0">`;
    s += `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${fmt(firstAt / TOTAL)};${fmt((firstAt + 0.05) / TOTAL)};${fmt((TOTAL - 0.05) / TOTAL)};1" dur="${TOTAL}s" repeatCount="indefinite"/>`;
    s += `</use>`;

    // Count text - update with set tags as collected
    const tx = hbX + (i + 1) * slotSize - 1.5;
    const ty = hbY + slotSize - 2;
    s += `<text x="${tx}" y="${ty}" text-anchor="end" font-size="6.5" fill="#fff" font-weight="900" stroke="#000" stroke-width="0.4">`;
    s += `0`;
    for (let j = 0; j < typeCollectTimes[t].length; j++) {
      const tval = typeCollectTimes[t][j];
      s += `<set attributeName="textContent" to="${j + 1}" begin="${fmt(tval)}s;${fmt(tval + TOTAL)}s"/>`;
    }
    s += `<set attributeName="textContent" to="0" begin="${fmt(TOTAL - 0.05)}s;${fmt(TOTAL * 2 - 0.05)}s"/>`;
    s += `</text>`;
  }
  s += `</g>`;

  // ===== HEARTS (10) =====
  const heartY = hbY - 12;
  const heartX = hbX;
  s += `<g>`;
  for (let i = 0; i < 10; i++) {
    const x = heartX + i * 8;
    s += renderHeart(x, heartY);
  }
  s += `</g>`;

  // ===== FOOD (10) =====
  const foodX = hbX + hbW - 80;
  s += `<g>`;
  for (let i = 0; i < 10; i++) {
    const x = foodX + i * 8;
    s += renderFood(x, heartY);
  }
  s += `</g>`;

  // XP bar
  const xpY = hbY - 4;
  s += `<rect x="${hbX}" y="${xpY}" width="${hbW}" height="2.5" fill="#1f1f1f"/>`;
  s += `<rect x="${hbX}" y="${xpY}" width="0" height="2.5" fill="#7eea3a">`;
  // animate width 0 → full
  s += `<animate attributeName="width" values="0;${hbW};0" keyTimes="0;${fmt((TOTAL - T_OUTRO) / TOTAL)};1" dur="${TOTAL}s" repeatCount="indefinite"/>`;
  s += `</rect>`;
  // XP level number
  s += `<text x="${W / 2}" y="${xpY - 1.5}" text-anchor="middle" font-size="6" fill="#7eea3a" font-weight="900" stroke="#000" stroke-width="0.4">`;
  s += `0`;
  const lvls = 30;
  for (let i = 1; i <= lvls; i++) {
    const t = T_INTRO + (i / lvls) * (TOTAL - T_INTRO - T_OUTRO);
    s += `<set attributeName="textContent" to="${i}" begin="${fmt(t)}s;${fmt(t + TOTAL)}s"/>`;
  }
  s += `<set attributeName="textContent" to="0" begin="${fmt(TOTAL - 0.05)}s;${fmt(TOTAL * 2 - 0.05)}s"/>`;
  s += `</text>`;

  return s;
}

function renderHeart(x, y) {
  // Pixel heart (7x6)
  let s = `<g transform="translate(${x},${y})">`;
  s += `<rect x="1" y="1" width="2" height="1" fill="#7d1d1d"/>`;
  s += `<rect x="4" y="1" width="2" height="1" fill="#7d1d1d"/>`;
  s += `<rect x="0" y="2" width="7" height="2" fill="#dc2626"/>`;
  s += `<rect x="1" y="4" width="5" height="1" fill="#dc2626"/>`;
  s += `<rect x="2" y="5" width="3" height="1" fill="#dc2626"/>`;
  s += `<rect x="3" y="6" width="1" height="1" fill="#dc2626"/>`;
  // highlight
  s += `<rect x="1" y="2" width="1" height="1" fill="#ff6a6a"/>`;
  s += `</g>`;
  return s;
}

function renderFood(x, y) {
  // Pixel drumstick (7x7)
  let s = `<g transform="translate(${x},${y})">`;
  s += `<rect x="1" y="0" width="3" height="1" fill="#8a4a20"/>`;
  s += `<rect x="0" y="1" width="5" height="3" fill="#c87841"/>`;
  s += `<rect x="0" y="1" width="5" height="1" fill="#dba072"/>`;
  s += `<rect x="1" y="4" width="4" height="1" fill="#8a4a20"/>`;
  s += `<rect x="3" y="4" width="3" height="1" fill="#e8d8b0"/>`;
  s += `<rect x="4" y="5" width="2" height="1" fill="#e8d8b0"/>`;
  s += `</g>`;
  return s;
}

function renderSaved(T, tEnd) {
  const cx = W / 2, cy = H / 2 - 5;
  const k1 = fmt(tEnd / TOTAL);
  const k2 = fmt((tEnd + 0.3) / TOTAL);
  const k3 = fmt((TOTAL - 0.5) / TOTAL);
  const k4 = fmt((TOTAL - 0.1) / TOTAL);
  let s = `<g opacity="0">`;
  s += `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${k1};${k2};${k3};${k4};1" dur="${TOTAL}s" repeatCount="indefinite"/>`;
  // Translucent dark backdrop
  s += `<rect x="${cx - 110}" y="${cy - 18}" width="220" height="36" fill="#000" opacity="0.7"/>`;
  s += `<rect x="${cx - 110}" y="${cy - 18}" width="220" height="36" fill="none" stroke="#fff" stroke-width="1"/>`;
  // Saving icon (rotating)
  s += `<g transform="translate(${cx - 90},${cy})">`;
  s += `<g>`;
  s += `<rect x="-3" y="-3" width="6" height="6" fill="#7eea3a"/>`;
  s += `<rect x="-2" y="-2" width="4" height="4" fill="#3a8a1c"/>`;
  s += `<animateTransform attributeName="transform" type="rotate" values="0;90;180;270;360" keyTimes="0;0.25;0.5;0.75;1" dur="2s" repeatCount="indefinite"/>`;
  s += `</g>`;
  s += `</g>`;
  // Text
  s += `<text x="${cx + 5}" y="${cy - 2}" text-anchor="middle" font-size="11" font-weight="900" fill="#ffd83a" letter-spacing="3" stroke="#3a2a00" stroke-width="0.5">GAME SAVED</text>`;
  s += `<text x="${cx + 5}" y="${cy + 9}" text-anchor="middle" font-size="6.5" fill="#aaa" letter-spacing="2">Saving world: contributions...</text>`;
  s += `</g>`;
  return s;
}

// ============================================================
// ADAPTIVE wrapper
// ============================================================
function buildAdaptive(grid) {
  const tok = {
    sky:'var(--sky)', skyTop:'var(--skyTop)',
    grass:'#5a9943', grassTop:'#3d7a2c',
    dirt:'#6b4423',
    stone:'var(--stone)', stoneDark:'var(--stoneDark)',
    cave:'var(--cave)',
    fg:'var(--fg)', fgDim:'var(--fgDim)',
    border:'#000',
    hudBg:'#3b3b3b', hudBgDark:'#1f1f1f', hudBorder:'#000',
    heart:'#dc2626', food:'#c87841',
    scan:'var(--scan)',
  };
  const svg = buildSVG(tok, grid);
  const style = `<style>
:root{--sky:${LIGHT.sky};--skyTop:${LIGHT.skyTop};--stone:${LIGHT.stone};--stoneDark:${LIGHT.stoneDark};--cave:${LIGHT.cave};--fg:${LIGHT.fg};--fgDim:${LIGHT.fgDim};--scan:${LIGHT.scan};}
@media (prefers-color-scheme: dark){:root{--sky:${DARK.sky};--skyTop:${DARK.skyTop};--stone:${DARK.stone};--stoneDark:${DARK.stoneDark};--cave:${DARK.cave};--fg:${DARK.fg};--fgDim:${DARK.fgDim};--scan:${DARK.scan};}}
</style>`;
  return svg.replace('<defs>', `<defs>${style}`);
}

export { buildAdaptive as renderCodeMinerMinecraftGrid };

