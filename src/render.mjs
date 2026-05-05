import { renderCodeMinerMinecraftGrid } from "./code-miner-minecraft.mjs";
import { renderHashCrackerGrid } from "./hash-cracker.mjs";
import { renderBuildPipelineGrid } from "./build-pipeline.mjs";

export const themes = {
  fire: {
    background: "#0d1117",
    text: "#f2f2f2",
    muted: "#8b949e",
    empty: "#17191f",
    levels: ["#3a1f20", "#79321f", "#c8401f", "#fe4701"],
    accent: "#fe4701",
    secondary: "#ff0054",
  },
  neon: {
    background: "#080a12",
    text: "#f6f7fb",
    muted: "#8c92a6",
    empty: "#151724",
    levels: ["#17324f", "#205c7a", "#2aa2a3", "#38f8c8"],
    accent: "#38f8c8",
    secondary: "#8f5cff",
  },
  ocean: {
    background: "#071018",
    text: "#edf7ff",
    muted: "#7c93a7",
    empty: "#111d29",
    levels: ["#12334a", "#155a73", "#1e91a8", "#6ee7f9"],
    accent: "#6ee7f9",
    secondary: "#2f80ed",
  },
};

export const variants = {
  runner: {
    label: "Commit Runner",
    meta: "energy cursor crossing active days",
    marker: `<path class="runner-wing" d="M8 0 L14 16 L8 12 L2 16 Z" opacity=".9" /><circle class="runner-core" cx="8" cy="8" r="4.5" />`,
    trackDash: "3 8",
    sparkShape: "circle",
  },
  spaceship: {
    label: "Commit Invaders",
    meta: "a base ship shoots stronger contribution blocks",
    marker: `<path class="runner-wing" d="M8 0 L15 15 L8 11 L1 15 Z" /><circle class="runner-core" cx="8" cy="8" r="3.5" /><path class="runner-flame" d="M5 14 L8 21 L11 14 Z" />`,
    trackDash: "2 9",
    sparkShape: "star",
  },
  train: {
    label: "Train Code",
    meta: "a tiny train moves through the commit line",
    marker: `<rect class="runner-wing" x="1" y="5" width="14" height="8" rx="2" /><rect class="runner-core" x="4" y="2" width="7" height="6" rx="1.5" /><circle class="runner-core" cx="4" cy="15" r="2" /><circle class="runner-core" cx="12" cy="15" r="2" />`,
    trackDash: "1 6",
    sparkShape: "square",
  },
  rocket: {
    label: "Rocket Trail",
    meta: "a rocket leaves a trail over contribution peaks",
    marker: `<path class="runner-core" d="M8 0 C14 6 14 12 8 18 C2 12 2 6 8 0 Z" /><circle class="runner-wing" cx="8" cy="7" r="2.2" /><path class="runner-flame" d="M5 16 L8 24 L11 16 Z" />`,
    trackDash: "6 8",
    sparkShape: "circle",
  },
  pulse: {
    label: "Data Pulse",
    meta: "a signal activates the calendar as it travels",
    marker: `<circle class="runner-core" cx="8" cy="8" r="5" /><circle class="runner-wing" cx="8" cy="8" r="9" opacity=".25"><animate attributeName="r" values="5;13;5" dur="1.2s" repeatCount="indefinite" /></circle>`,
    trackDash: "10 5",
    sparkShape: "ring",
  },
  miner: {
    label: "Code Miner",
    meta: "a miner collects contribution blocks",
    marker: `<rect class="runner-core" x="3" y="5" width="10" height="10" rx="2" /><path class="runner-wing" d="M2 5 L8 0 L14 5 Z" /><path class="runner-flame" d="M12 2 L17 7 M15 4 L10 9" />`,
    trackDash: "4 7",
    sparkShape: "diamond",
  },
  scanner: {
    label: "Laser Scanner",
    meta: "a scanner reads contribution intensity",
    marker: `<rect class="runner-core" x="2" y="4" width="12" height="8" rx="2" /><path class="runner-wing" d="M14 8 L24 4 L24 12 Z" opacity=".55" /><circle class="runner-core" cx="5" cy="8" r="2" />`,
    trackDash: "2 5",
    sparkShape: "line",
  },
  minecraft: {
    label: "Code Miner Minecraft",
    meta: "Minecraft-style miner breaks contribution ore blocks",
    marker: "",
    trackDash: "4 7",
    sparkShape: "diamond",
  },
  hash: {
    label: "Hash Cracker",
    meta: "terminal hash stream decrypts active contribution days",
    marker: "",
    trackDash: "2 5",
    sparkShape: "line",
  },
  pipeline: {
    label: "Build Pipeline",
    meta: "commits travel through CI stages",
    marker: "",
    trackDash: "5 5",
    sparkShape: "square",
  },
};

export function renderContributionRunner({ username: login, weeks, title, theme, variant = "runner" }) {
  const cell = 12;
  const gap = 4;
  const padX = 34;
  const padY = 42;
  const width = padX * 2 + weeks.length * (cell + gap) - gap;
  const height = variant === "spaceship" ? 210 : 170;
  const gridHeight = 7 * (cell + gap) - gap;
  const gridY = padY + 24;
  const selected = variants[variant] || variants.runner;
  const label = title || selected.label;
  const days = weeks.flatMap((week, weekIndex) =>
    week.contributionDays.map((day, dayIndex) => ({ ...day, weekIndex, dayIndex })),
  );
  const total = days.reduce((sum, day) => sum + day.contributionCount, 0);
  const max = Math.max(1, ...days.map((day) => day.contributionCount));
  const activeDays = days.filter((day) => day.contributionCount > 0);
  const pathDays = activeDays.length ? activeDays : days.filter((_, index) => index % 17 === 0);
  const pathPoints = pathDays.map(center);
  const runnerPath = pathPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");

  if (variant === "spaceship") {
    return renderCommitInvadersGame({ login, days, total, max, label });
  }

  if (variant === "minecraft") {
    return renderCodeMinerMinecraftGrid(daysToPrototypeGrid(days, max));
  }

  if (variant === "hash") {
    return renderHashCrackerGrid(daysToPrototypeGrid(days, max));
  }

  if (variant === "pipeline") {
    return renderBuildPipelineGrid(daysToPrototypeGrid(days, max));
  }

  const grid = days
    .map((day, index) => {
      const point = xy(day);
      const level = intensity(day.contributionCount);
      const delay = ((index % 28) * 0.08).toFixed(2);
      return `<rect class="cell level-${level}" x="${point.x}" y="${point.y}" width="${cell}" height="${cell}" rx="3">
        <title>${escapeXml(day.date)}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}</title>
        <animate attributeName="opacity" values=".72;1;.72" dur="4.8s" begin="${delay}s" repeatCount="indefinite" />
      </rect>`;
    })
    .join("\n");

  const sparks = pathDays
    .slice(0, 80)
    .map((day, index) => renderSpark(center(day), index, Math.min(5, 2 + intensity(day.contributionCount)), selected.sparkShape))
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
    <title id="title">${escapeXml(label)} contribution animation</title>
    <desc id="desc">Animated custom contribution graph for ${escapeXml(login)} with ${total} contributions in the last year.</desc>
    <style>
      :root { color-scheme: dark; }
      .bg { fill: ${theme.background}; }
      .label { font: 700 16px 'JetBrains Mono', Consolas, monospace; fill: ${theme.text}; letter-spacing: 0; }
      .meta { font: 500 11px 'JetBrains Mono', Consolas, monospace; fill: ${theme.muted}; letter-spacing: 0; }
      .cell { stroke: #ffffff14; stroke-width: 1; }
      .level-0 { fill: ${theme.empty}; }
      .level-1 { fill: ${theme.levels[0]}; }
      .level-2 { fill: ${theme.levels[1]}; }
      .level-3 { fill: ${theme.levels[2]}; }
      .level-4 { fill: ${theme.levels[3]}; }
      .track { fill: none; stroke: ${theme.secondary}33; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: ${selected.trackDash}; }
      .runner-core { fill: ${theme.accent}; filter: drop-shadow(0 0 7px ${theme.accent}); }
      .runner-wing { fill: ${theme.secondary}; }
      .runner-flame { fill: ${theme.secondary}; stroke: ${theme.secondary}; stroke-width: 2; stroke-linecap: round; filter: drop-shadow(0 0 6px ${theme.secondary}); }
      .spark { fill: ${theme.secondary}; stroke: ${theme.secondary}; stroke-width: 2; filter: drop-shadow(0 0 5px ${theme.secondary}); }
      .scan { fill: url(#scanGradient); opacity: .38; }
    </style>
    <defs>
      <linearGradient id="scanGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${theme.accent}" stop-opacity="0" />
        <stop offset=".5" stop-color="${theme.accent}" stop-opacity=".75" />
        <stop offset="1" stop-color="${theme.secondary}" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect class="bg" width="100%" height="100%" rx="10" />
    <text class="label" x="${padX}" y="28">${escapeXml(label)}</text>
    <text class="meta" x="${padX}" y="47">${total} contributions - ${escapeXml(selected.meta)}</text>
    <rect class="scan" x="${padX}" y="${gridY - 8}" width="42" height="${gridHeight + 16}" rx="10">
      <animate attributeName="x" values="${padX};${width - padX - 42};${padX}" dur="9s" repeatCount="indefinite" />
    </rect>
    ${grid}
    <path class="track" d="${runnerPath}" />
    ${sparks}
    <g transform="translate(-8 -8)">
      <animateMotion dur="14s" repeatCount="indefinite" rotate="auto" path="${runnerPath}" />
      ${selected.marker}
    </g>
  </svg>
  `;

  function intensity(count) {
    if (count === 0) return 0;
    if (count <= max * 0.25) return 1;
    if (count <= max * 0.5) return 2;
    if (count <= max * 0.75) return 3;
    return 4;
  }

  function xy(day) {
    return {
      x: padX + day.weekIndex * (cell + gap),
      y: gridY + day.dayIndex * (cell + gap),
    };
  }

  function center(day) {
    const point = xy(day);
    return {
      x: point.x + cell / 2,
      y: point.y + cell / 2,
    };
  }

  function renderCommitInvaders() {
    const shipY = height - 25;
    const targets = activeDays.length ? activeDays : days.filter((_, index) => index % 19 === 0);
    const invaderGrid = days
      .map((day, index) => {
        const point = xy(day);
        const level = intensity(day.contributionCount);
        const delay = ((index % 36) * 0.07).toFixed(2);
        const hitDelay = ((index % 52) * 0.16).toFixed(2);
        const hitDuration = (2.4 + level * 0.55).toFixed(2);
        const shield = level >= 3
          ? `<rect class="shield" x="${point.x - 2}" y="${point.y - 2}" width="${cell + 4}" height="${cell + 4}" rx="4">
              <animate attributeName="opacity" values="0;.45;0;.2;0" dur="${hitDuration}s" begin="${hitDelay}s" repeatCount="indefinite" />
            </rect>`
          : "";
        return `<g>
          <rect class="cell level-${level}" x="${point.x}" y="${point.y}" width="${cell}" height="${cell}" rx="3">
            <title>${escapeXml(day.date)}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}</title>
            <animate attributeName="opacity" values=".85;1;.85" dur="4.8s" begin="${delay}s" repeatCount="indefinite" />
            ${level > 0 ? `<animate attributeName="opacity" values="1;.25;1;.55;1" dur="${hitDuration}s" begin="${hitDelay}s" repeatCount="indefinite" />` : ""}
          </rect>
          ${shield}
        </g>`;
      })
      .join("\n");

    const lasers = targets
      .slice(0, 90)
      .map((day, index) => {
        const point = center(day);
        const level = intensity(day.contributionCount);
        const delay = ((index * 0.19) % 10).toFixed(2);
        const widthByLevel = 1.3 + level * 0.45;
        const blastSize = 2 + level * 1.7;
        return `<g opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur=".72s" begin="${delay}s" repeatCount="indefinite" />
          <path class="laser" d="M${point.x} ${shipY - 14} L${point.x} ${point.y + cell / 2}" stroke-width="${widthByLevel.toFixed(1)}" />
          <circle class="blast" cx="${point.x}" cy="${point.y}" r="${blastSize.toFixed(1)}">
            <animate attributeName="r" values="1;${(blastSize + 3).toFixed(1)};1" dur=".72s" begin="${delay}s" repeatCount="indefinite" />
          </circle>
        </g>`;
      })
      .join("\n");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
      <title id="title">${escapeXml(label)} contribution animation</title>
      <desc id="desc">Space Invaders inspired contribution graph for ${escapeXml(login)} with ${total} contributions in the last year.</desc>
      <style>
        :root { color-scheme: dark; }
        .bg { fill: ${theme.background}; }
        .label { font: 700 16px 'JetBrains Mono', Consolas, monospace; fill: ${theme.text}; letter-spacing: 0; }
        .meta { font: 500 11px 'JetBrains Mono', Consolas, monospace; fill: ${theme.muted}; letter-spacing: 0; }
        .cell { stroke: #ffffff14; stroke-width: 1; }
        .level-0 { fill: ${theme.empty}; }
        .level-1 { fill: ${theme.levels[0]}; }
        .level-2 { fill: ${theme.levels[1]}; }
        .level-3 { fill: ${theme.levels[2]}; }
        .level-4 { fill: ${theme.levels[3]}; }
        .shield { fill: none; stroke: ${theme.accent}; stroke-width: 1.5; filter: drop-shadow(0 0 5px ${theme.accent}); }
        .laser { stroke: ${theme.accent}; stroke-linecap: round; filter: drop-shadow(0 0 7px ${theme.accent}); }
        .blast { fill: ${theme.secondary}; opacity: .72; filter: drop-shadow(0 0 7px ${theme.secondary}); }
        .ship-core { fill: ${theme.accent}; filter: drop-shadow(0 0 8px ${theme.accent}); }
        .ship-wing { fill: ${theme.secondary}; filter: drop-shadow(0 0 6px ${theme.secondary}); }
        .barrier { fill: ${theme.secondary}; opacity: .18; }
      </style>
      <rect class="bg" width="100%" height="100%" rx="10" />
      <text class="label" x="${padX}" y="28">${escapeXml(label)}</text>
      <text class="meta" x="${padX}" y="47">${total} contributions - stronger colors take more hits</text>
      ${invaderGrid}
      ${lasers}
      <g transform="translate(0 ${shipY})">
        <animateTransform attributeName="transform" type="translate" values="${padX} ${shipY};${width - padX - 28} ${shipY};${padX} ${shipY}" dur="8s" repeatCount="indefinite" />
        <path class="ship-wing" d="M0 12 L8 5 L16 12 L28 15 L28 21 L0 21 Z" />
        <rect class="ship-core" x="9" y="0" width="10" height="14" rx="2" />
        <rect class="ship-core" x="3" y="16" width="22" height="5" rx="2" />
      </g>
      <rect class="barrier" x="${padX}" y="${shipY - 8}" width="${width - padX * 2}" height="2" rx="1" />
    </svg>
    `;
  }
}

function renderSpark(point, index, radius, shape) {
  const delay = ((index * 0.18) % 11).toFixed(2);
  const pulse = `<animate attributeName="opacity" values="0;.95;0" dur="2.4s" begin="${delay}s" repeatCount="indefinite" />`;
  if (shape === "star") {
    return `<path class="spark" d="M${point.x} ${point.y - radius} L${point.x + 1.5} ${point.y - 1.5} L${point.x + radius} ${point.y} L${point.x + 1.5} ${point.y + 1.5} L${point.x} ${point.y + radius} L${point.x - 1.5} ${point.y + 1.5} L${point.x - radius} ${point.y} L${point.x - 1.5} ${point.y - 1.5} Z" opacity="0">${pulse}</path>`;
  }
  if (shape === "square") {
    return `<rect class="spark" x="${point.x - radius / 2}" y="${point.y - radius / 2}" width="${radius}" height="${radius}" rx="1" opacity="0">${pulse}</rect>`;
  }
  if (shape === "ring") {
    return `<circle class="spark" cx="${point.x}" cy="${point.y}" r="${radius}" fill="none" opacity="0">${pulse}<animate attributeName="r" values="1;${radius + 4};1" dur="2.4s" begin="${delay}s" repeatCount="indefinite" /></circle>`;
  }
  if (shape === "diamond") {
    return `<path class="spark" d="M${point.x} ${point.y - radius} L${point.x + radius} ${point.y} L${point.x} ${point.y + radius} L${point.x - radius} ${point.y} Z" opacity="0">${pulse}</path>`;
  }
  if (shape === "line") {
    return `<path class="spark" d="M${point.x - radius} ${point.y} L${point.x + radius} ${point.y}" opacity="0">${pulse}</path>`;
  }
  return `<circle class="spark" cx="${point.x}" cy="${point.y}" r="${radius}" opacity="0">
    ${pulse}
    <animate attributeName="r" values="1;${radius};1" dur="2.4s" begin="${delay}s" repeatCount="indefinite" />
  </circle>`;
}

const INVADER_W = 860;
const INVADER_H = 200;
const INVADER_CELL = 11;
const INVADER_GAP = 2;
const INVADER_GRID_X = 24;
const INVADER_GRID_Y = 38;
const INVADER_TOTAL = 60;
const INVADER_INTRO = 2;
const INVADER_OUTRO = 4;
const INVADER_SHIP_Y = 178;
const INVADER_SHIP_W = 22;

const INVADER_DARK = {
  bg: "#0d1117",
  dim: "#30363d",
  star: "#1f6feb",
  accent: "#39d353",
  levels: ["#0e4429", "#006d32", "#26a641", "#39d353"],
  laser: "#39d353",
  enemyLaser: "#f78166",
  ship: "#39d353",
  shipGlow: "#26a641",
  hud: "#39d353",
  hudDim: "#8b949e",
  scan: "rgba(57,211,83,0.05)",
  crash: "#f78166",
};

const INVADER_LIGHT = {
  bg: "#ffffff",
  dim: "#d0d7de",
  star: "#0969da",
  accent: "#1a7f37",
  levels: ["#9be9a8", "#40c463", "#30a14e", "#216e39"],
  laser: "#1a7f37",
  enemyLaser: "#cf222e",
  ship: "#1a7f37",
  shipGlow: "#2da44e",
  hud: "#1a7f37",
  hudDim: "#57606a",
  scan: "rgba(26,127,55,0.04)",
  crash: "#cf222e",
};

const INVADER_FRAME_A = [
  "0010100",
  "0011100",
  "0111110",
  "1110111",
  "1111111",
  "0101010",
  "1010101",
];

const INVADER_FRAME_B = [
  "0010100",
  "1011101",
  "1111111",
  "1110111",
  "0111110",
  "1000001",
  "0100010",
];

const INVADER_EXPLOSION = [
  "1010101",
  "0100010",
  "1011101",
  "0011100",
  "1011101",
  "0100010",
  "1010101",
];

const INVADER_PATH_A = spritePath(INVADER_FRAME_A);
const INVADER_PATH_B = spritePath(INVADER_FRAME_B);
const INVADER_PATH_X = spritePath(INVADER_EXPLOSION);

function renderCommitInvadersGame({ login, days, total, max, label }) {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 53 }, () => 0));
  for (const day of days) {
    if (day.weekIndex < 53 && day.dayIndex < 7) {
      grid[day.dayIndex][day.weekIndex] = invaderLevel(day.contributionCount, max);
    }
  }

  const tokens = {
    bg: "var(--bg)",
    dim: "var(--dim)",
    star: "var(--star)",
    accent: "var(--accent)",
    levels: ["var(--l1)", "var(--l2)", "var(--l3)", "var(--l4)"],
    laser: "var(--laser)",
    enemyLaser: "var(--elaser)",
    ship: "var(--ship)",
    shipGlow: "var(--shipg)",
    hud: "var(--hud)",
    hudDim: "var(--hudd)",
    scan: "var(--scan)",
    crash: "var(--crash)",
  };

  const adaptiveStyle = `<style>
:root{--bg:${INVADER_LIGHT.bg};--dim:${INVADER_LIGHT.dim};--star:${INVADER_LIGHT.star};--accent:${INVADER_LIGHT.accent};--l1:${INVADER_LIGHT.levels[0]};--l2:${INVADER_LIGHT.levels[1]};--l3:${INVADER_LIGHT.levels[2]};--l4:${INVADER_LIGHT.levels[3]};--laser:${INVADER_LIGHT.laser};--elaser:${INVADER_LIGHT.enemyLaser};--ship:${INVADER_LIGHT.ship};--shipg:${INVADER_LIGHT.shipGlow};--hud:${INVADER_LIGHT.hud};--hudd:${INVADER_LIGHT.hudDim};--scan:${INVADER_LIGHT.scan};--crash:${INVADER_LIGHT.crash};}
@media (prefers-color-scheme: dark){:root{--bg:${INVADER_DARK.bg};--dim:${INVADER_DARK.dim};--star:${INVADER_DARK.star};--accent:${INVADER_DARK.accent};--l1:${INVADER_DARK.levels[0]};--l2:${INVADER_DARK.levels[1]};--l3:${INVADER_DARK.levels[2]};--l4:${INVADER_DARK.levels[3]};--laser:${INVADER_DARK.laser};--elaser:${INVADER_DARK.enemyLaser};--ship:${INVADER_DARK.ship};--shipg:${INVADER_DARK.shipGlow};--hud:${INVADER_DARK.hud};--hudd:${INVADER_DARK.hudDim};--scan:${INVADER_DARK.scan};--crash:${INVADER_DARK.crash};}}
</style>`;

  return buildInvadersSvg(tokens, grid, {
    adaptiveStyle,
    login,
    label,
    total,
  });
}

function buildInvadersSvg(theme, grid, { adaptiveStyle, login, label, total }) {
  const invaders = [];
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 53; col += 1) {
      if (grid[row][col] > 0) {
        invaders.push({ row, col, hp: grid[row][col], level: grid[row][col] });
      }
    }
  }

  invaders.sort((a, b) => b.row - a.row || a.col - b.col);

  const totalShots = Math.max(1, invaders.reduce((sum, invader) => sum + invader.hp, 0));
  const battleEnd = INVADER_TOTAL - INVADER_OUTRO;
  const interval = (battleEnd - INVADER_INTRO) / totalShots;

  let shotIndex = 0;
  for (const invader of invaders) {
    invader.hits = [];
    for (let hit = 0; hit < invader.hp; hit += 1) {
      invader.hits.push(INVADER_INTRO + shotIndex * interval);
      shotIndex += 1;
    }
    invader.dieAt = invader.hits[invader.hits.length - 1] + 0.04;
  }

  const stops = [{ t: 0, x: INVADER_W / 2 - INVADER_SHIP_W / 2 }];
  for (const invader of invaders) {
    const targetX = invaderX(invader.col) + INVADER_CELL / 2 - INVADER_SHIP_W / 2;
    stops.push({ t: Math.max(0.1, invader.hits[0] - 0.25), x: targetX });
    stops.push({ t: invader.dieAt, x: targetX });
  }
  stops.push({ t: battleEnd + 0.4, x: INVADER_W / 2 - INVADER_SHIP_W / 2 });
  stops.push({ t: INVADER_TOTAL, x: INVADER_W / 2 - INVADER_SHIP_W / 2 });
  stops.sort((a, b) => a.t - b.t);

  const compactStops = [];
  for (const stop of stops) {
    if (compactStops.length && Math.abs(compactStops[compactStops.length - 1].t - stop.t) < 0.005) {
      compactStops[compactStops.length - 1] = stop;
    } else {
      compactStops.push(stop);
    }
  }

  const pixel = INVADER_CELL / 7;
  const escapedLabel = escapeXml(label);
  const escapedLogin = escapeXml(login);
  let output = "";

  output += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${INVADER_W} ${INVADER_H}" width="${INVADER_W}" height="${INVADER_H}" role="img" aria-labelledby="title desc" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace">`;
  output += `<title id="title">${escapedLabel} contribution animation</title>`;
  output += `<desc id="desc">Space Invaders inspired contribution graph for ${escapedLogin} with ${total} contributions in the last year.</desc>`;
  output += `<defs>${adaptiveStyle}`;
  output += `<filter id="g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="0.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  output += `<radialGradient id="vig" cx="50%" cy="50%" r="70%"><stop offset="60%" stop-color="${theme.bg}" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.45"/></radialGradient>`;
  output += `<pattern id="scan" width="2" height="3" patternUnits="userSpaceOnUse"><rect width="2" height="1" fill="${theme.scan}"/></pattern>`;
  for (let level = 0; level < 4; level += 1) {
    output += `<symbol id="iA${level}" viewBox="0 0 7 7" overflow="visible"><path d="${INVADER_PATH_A}" fill="${theme.levels[level]}"/></symbol>`;
    output += `<symbol id="iB${level}" viewBox="0 0 7 7" overflow="visible"><path d="${INVADER_PATH_B}" fill="${theme.levels[level]}"/></symbol>`;
  }
  output += `<symbol id="ex" viewBox="0 0 7 7" overflow="visible"><path d="${INVADER_PATH_X}" fill="${theme.crash}"/></symbol>`;
  output += `<symbol id="ship" viewBox="0 0 22 12" overflow="visible"><rect x="10" y="0" width="2" height="3" fill="${theme.ship}"/><rect x="8" y="3" width="6" height="2" fill="${theme.ship}"/><rect x="2" y="5" width="18" height="3" fill="${theme.ship}"/><rect x="0" y="8" width="22" height="2" fill="${theme.shipGlow}"/></symbol>`;
  output += `</defs>`;

  output += `<rect width="${INVADER_W}" height="${INVADER_H}" fill="${theme.bg}"/>`;
  output += renderStars(theme);
  output += renderInvadersHud(theme);
  output += renderInvadersFrame(theme);
  output += `<g><animateTransform attributeName="transform" type="translate" values="-3,0;3,0" keyTimes="0;0.5" dur="1.6s" repeatCount="indefinite" calcMode="discrete"/>`;
  output += `<g><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.49;0.5;0.99;1" dur="0.9s" repeatCount="indefinite"/>`;
  for (const invader of invaders) output += renderInvaderSprite(invader, "A", pixel);
  output += `</g><g><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.49;0.5;0.99;1" dur="0.9s" repeatCount="indefinite"/>`;
  for (const invader of invaders) output += renderInvaderSprite(invader, "B", pixel);
  output += `</g>`;
  for (const invader of invaders) output += renderInvaderExplosion(invader, pixel);
  output += `</g>`;
  output += renderEnemyLasers(theme, invaders);
  output += renderPlayerLasers(theme, invaders);
  output += renderInvaderShip(compactStops);
  output += renderVictory(theme, battleEnd + 0.5);
  output += `<rect width="${INVADER_W}" height="${INVADER_H}" fill="url(#scan)" pointer-events="none"/>`;
  output += `<rect width="${INVADER_W}" height="${INVADER_H}" fill="url(#vig)" pointer-events="none"/>`;
  output += `<text x="${INVADER_W - 10}" y="${INVADER_H - 6}" text-anchor="end" font-size="7" fill="${theme.hudDim}" letter-spacing="2" opacity="0.6">github-contrib-runner</text>`;
  output += `</svg>`;

  return output;
}

function renderStars(theme) {
  let seed = 99;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  let output = `<g opacity="0.55">`;
  for (let index = 0; index < 40; index += 1) {
    const x = random() * INVADER_W;
    const y = random() * INVADER_H;
    const radius = 0.4 + random() * 0.7;
    const duration = 2 + random() * 4;
    const begin = -random() * duration;
    output += `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(radius)}" fill="${theme.star}"><animate attributeName="opacity" values="0.15;1;0.15" dur="${fmt(duration)}s" begin="${fmt(begin)}s" repeatCount="indefinite"/></circle>`;
  }
  output += `</g>`;
  return output;
}

function renderInvadersHud(theme) {
  let output = `<g font-size="9" letter-spacing="2">`;
  output += `<text x="20" y="16" fill="${theme.hudDim}">SCORE</text>`;
  output += `<text x="20" y="27" fill="${theme.hud}" font-weight="bold">00000`;
  for (let index = 1; index <= 12; index += 1) {
    const time = INVADER_INTRO + (index / 12) * (INVADER_TOTAL - INVADER_INTRO - INVADER_OUTRO);
    output += `<set attributeName="textContent" to="${String(index * 290).padStart(5, "0")}" begin="${fmt(time)}s;${fmt(time + INVADER_TOTAL)}s"/>`;
  }
  output += `<set attributeName="textContent" to="00000" begin="${fmt(INVADER_TOTAL - 0.05)}s;${fmt(INVADER_TOTAL * 2 - 0.05)}s"/></text>`;
  output += `<text x="${INVADER_W / 2 - 36}" y="16" fill="${theme.hudDim}">HI-SCORE</text>`;
  output += `<text x="${INVADER_W / 2 - 36}" y="27" fill="${theme.hud}" font-weight="bold">04829</text>`;
  output += `<text x="${INVADER_W - 110}" y="16" fill="${theme.hudDim}">WAVE</text>`;
  output += `<text x="${INVADER_W - 110}" y="27" fill="${theme.hud}" font-weight="bold">01</text>`;
  output += `<text x="${INVADER_W - 30}" y="16" fill="${theme.hudDim}">P1</text>`;
  output += `<text x="${INVADER_W - 30}" y="27" fill="${theme.accent}" font-weight="bold">●<animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite"/></text>`;
  output += `<text x="${INVADER_W / 2}" y="13" text-anchor="middle" font-size="11" fill="${theme.accent}" font-weight="bold" letter-spacing="6" filter="url(#g)">COMMIT INVADERS</text>`;
  output += `</g>`;
  return output;
}

function renderInvadersFrame(theme) {
  const y = 30;
  const height = INVADER_H - 38;
  return `<g stroke="${theme.dim}" stroke-width="1" fill="none" opacity="0.6">
    <path d="M 8 ${y}v7M 8 ${y}h7"/><path d="M ${INVADER_W - 8} ${y}v7M ${INVADER_W - 8} ${y}h-7"/>
    <path d="M 8 ${y + height}v-7M 8 ${y + height}h7"/><path d="M ${INVADER_W - 8} ${y + height}v-7M ${INVADER_W - 8} ${y + height}h-7"/>
  </g>`;
}

function renderInvaderSprite(invader, frame, pixel) {
  const die = invader.dieAt / INVADER_TOTAL;
  return `<use href="#i${frame}${invader.level - 1}" x="${invaderX(invader.col)}" y="${fmt(invaderY(invader.row) + pixel * 0.3)}" width="${INVADER_CELL}" height="${INVADER_CELL}">
    <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${fmt(die)};${fmt(Math.min(0.999, die + 0.005))};${fmt((INVADER_TOTAL - 0.05) / INVADER_TOTAL)};1" dur="${INVADER_TOTAL}s" repeatCount="indefinite"/>
  </use>`;
}

function renderInvaderExplosion(invader, pixel) {
  return `<use href="#ex" x="${invaderX(invader.col)}" y="${fmt(invaderY(invader.row) + pixel * 0.3)}" width="${INVADER_CELL}" height="${INVADER_CELL}" opacity="0">
    <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.5;1" dur="0.35s" begin="${fmt(invader.dieAt)}s;${fmt(invader.dieAt + INVADER_TOTAL)}s" fill="freeze"/>
  </use>`;
}

function renderPlayerLasers(theme, invaders) {
  let output = "";
  const flight = 0.22;
  for (const invader of invaders) {
    for (const hit of invader.hits) {
      const x = invaderX(invader.col) + INVADER_CELL / 2;
      const targetY = invaderY(invader.row) + INVADER_CELL / 2;
      const begin = hit - flight;
      output += `<rect x="${fmt(x - 1)}" y="${INVADER_SHIP_Y - 2}" width="2" height="6" fill="${theme.laser}" opacity="0">
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.85;1" dur="${flight}s" begin="${fmt(begin)}s;${fmt(begin + INVADER_TOTAL)}s" fill="freeze"/>
        <animate attributeName="y" values="${INVADER_SHIP_Y - 2};${fmt(targetY)}" dur="${flight}s" begin="${fmt(begin)}s;${fmt(begin + INVADER_TOTAL)}s" fill="freeze"/>
      </rect>`;
    }
  }
  return output;
}

function renderEnemyLasers(theme, invaders) {
  let output = "";
  let seed = 13;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let index = 0; index < 10; index += 1) {
    const invader = invaders[Math.floor(random() * invaders.length)];
    if (!invader) continue;
    const fireAt = INVADER_INTRO + 1 + random() * (INVADER_TOTAL - INVADER_INTRO - INVADER_OUTRO - 3);
    if (fireAt > invader.dieAt - 0.3) continue;
    const x = invaderX(invader.col) + INVADER_CELL / 2;
    const startY = invaderY(invader.row) + INVADER_CELL;
    const duration = 0.8 + random() * 0.4;
    output += `<rect x="${fmt(x - 0.5)}" y="${fmt(startY)}" width="1.5" height="5" fill="${theme.enemyLaser}" opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="${fmt(duration)}s" begin="${fmt(fireAt)}s;${fmt(fireAt + INVADER_TOTAL)}s" fill="freeze"/>
      <animate attributeName="y" values="${fmt(startY)};${fmt(INVADER_SHIP_Y - 2)}" dur="${fmt(duration)}s" begin="${fmt(fireAt)}s;${fmt(fireAt + INVADER_TOTAL)}s" fill="freeze"/>
    </rect>`;
  }
  return output;
}

function renderInvaderShip(stops) {
  const values = stops.map((stop) => fmt(stop.x)).join(";");
  const keyTimes = stops.map((stop) => fmt(Math.min(1, Math.max(0, stop.t / INVADER_TOTAL)))).join(";");
  return `<g filter="url(#g)">
    <g><use href="#ship" x="0" y="${INVADER_SHIP_Y}" width="22" height="12">
      <animate attributeName="x" values="${values}" keyTimes="${keyTimes}" dur="${INVADER_TOTAL}s" repeatCount="indefinite"/>
    </use></g>
    <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${fmt((INVADER_TOTAL - INVADER_OUTRO + 0.5) / INVADER_TOTAL)};${fmt((INVADER_TOTAL - INVADER_OUTRO + 0.6) / INVADER_TOTAL)};${fmt((INVADER_TOTAL - 0.05) / INVADER_TOTAL)};1" dur="${INVADER_TOTAL}s" repeatCount="indefinite"/>
  </g>`;
}

function renderVictory(theme, endTime) {
  const centerX = INVADER_W / 2;
  const centerY = INVADER_H / 2;
  return `<g opacity="0">
    <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${fmt(endTime / INVADER_TOTAL)};${fmt((endTime + 0.3) / INVADER_TOTAL)};${fmt((INVADER_TOTAL - 0.5) / INVADER_TOTAL)};${fmt((INVADER_TOTAL - 0.1) / INVADER_TOTAL)};1" dur="${INVADER_TOTAL}s" repeatCount="indefinite"/>
    <rect x="${centerX - 130}" y="${centerY - 22}" width="260" height="44" fill="${theme.bg}" stroke="${theme.accent}" stroke-width="1.5"/>
    <text x="${centerX}" y="${centerY - 3}" text-anchor="middle" font-size="14" font-weight="bold" fill="${theme.accent}" letter-spacing="6" filter="url(#g)">STAGE CLEAR</text>
    <text x="${centerX}" y="${centerY + 13}" text-anchor="middle" font-size="8" fill="${theme.hudDim}" letter-spacing="3">PRESS START TO CONTINUE<animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite"/></text>
  </g>`;
}

function invaderLevel(count, max) {
  if (count === 0) return 0;
  if (count <= max * 0.25) return 1;
  if (count <= max * 0.5) return 2;
  if (count <= max * 0.75) return 3;
  return 4;
}

function daysToPrototypeGrid(days, max) {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 53 }, () => 0));
  for (const day of days) {
    if (day.weekIndex < 53 && day.dayIndex < 7) {
      grid[day.dayIndex][day.weekIndex] = invaderLevel(day.contributionCount, max);
    }
  }
  return grid;
}

function invaderX(column) {
  return INVADER_GRID_X + column * (INVADER_CELL + INVADER_GAP);
}

function invaderY(row) {
  return INVADER_GRID_Y + row * (INVADER_CELL + INVADER_GAP);
}

function spritePath(rows) {
  let path = "";
  for (let row = 0; row < rows.length; row += 1) {
    let runStart = -1;
    for (let column = 0; column <= rows[row].length; column += 1) {
      const filled = column < rows[row].length && rows[row][column] === "1";
      if (filled && runStart < 0) runStart = column;
      if (!filled && runStart >= 0) {
        path += `M${runStart} ${row}h${column - runStart}v1h-${column - runStart}z`;
        runStart = -1;
      }
    }
  }
  return path;
}

function fmt(number) {
  return Math.round(number * 1000) / 1000;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
