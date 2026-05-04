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
    return renderCommitInvaders();
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

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
