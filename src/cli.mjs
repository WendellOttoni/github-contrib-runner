import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const themes = {
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

const username = getInput("username") || process.env.GITHUB_REPOSITORY_OWNER;
const token = getInput("token") || process.env.GITHUB_TOKEN;
const output = getInput("output") || "dist/contrib-runner.svg";
const title = getInput("title") || "Commit Runner";
const themeName = getInput("theme") || "fire";
const theme = themes[themeName] || themes.fire;

if (!username) {
  throw new Error("username is required.");
}

if (!token) {
  throw new Error("token is required.");
}

const weeks = await fetchContributionWeeks(username, token);
const svg = renderContributionRunner({ username, weeks, title, theme });

await mkdir(dirname(output), { recursive: true });
await writeFile(output, svg, "utf8");

console.log(`Generated ${output} for ${username}.`);

function getInput(name) {
  return process.env[`INPUT_${name.toUpperCase()}`]?.trim();
}

async function fetchContributionWeeks(login, githubToken) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }`;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${githubToken}`,
      "content-type": "application/json",
      "user-agent": "github-contrib-runner",
    },
    body: JSON.stringify({ query, variables: { login } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return payload.data.user.contributionsCollection.contributionCalendar.weeks;
}

function renderContributionRunner({ username: login, weeks, title: label, theme: palette }) {
  const cell = 12;
  const gap = 4;
  const padX = 34;
  const padY = 42;
  const width = padX * 2 + weeks.length * (cell + gap) - gap;
  const height = 170;
  const gridHeight = 7 * (cell + gap) - gap;
  const gridY = padY + 24;
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
    .map((day, index) => {
      const point = center(day);
      const delay = ((index * 0.18) % 11).toFixed(2);
      const radius = Math.min(5, 2 + intensity(day.contributionCount));
      return `<circle class="spark" cx="${point.x}" cy="${point.y}" r="${radius}" opacity="0">
        <animate attributeName="opacity" values="0;.95;0" dur="2.4s" begin="${delay}s" repeatCount="indefinite" />
        <animate attributeName="r" values="1;${radius};1" dur="2.4s" begin="${delay}s" repeatCount="indefinite" />
      </circle>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
    <title id="title">${escapeXml(label)} contribution animation</title>
    <desc id="desc">Animated custom contribution graph for ${escapeXml(login)} with ${total} contributions in the last year.</desc>
    <style>
      :root { color-scheme: dark; }
      .bg { fill: ${palette.background}; }
      .label { font: 700 16px 'JetBrains Mono', Consolas, monospace; fill: ${palette.text}; letter-spacing: 0; }
      .meta { font: 500 11px 'JetBrains Mono', Consolas, monospace; fill: ${palette.muted}; letter-spacing: 0; }
      .cell { stroke: #ffffff14; stroke-width: 1; }
      .level-0 { fill: ${palette.empty}; }
      .level-1 { fill: ${palette.levels[0]}; }
      .level-2 { fill: ${palette.levels[1]}; }
      .level-3 { fill: ${palette.levels[2]}; }
      .level-4 { fill: ${palette.levels[3]}; }
      .track { fill: none; stroke: ${palette.secondary}33; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 3 8; }
      .runner-core { fill: ${palette.accent}; filter: drop-shadow(0 0 7px ${palette.accent}); }
      .runner-wing { fill: ${palette.secondary}; }
      .spark { fill: ${palette.secondary}; filter: drop-shadow(0 0 5px ${palette.secondary}); }
      .scan { fill: url(#scanGradient); opacity: .38; }
    </style>
    <defs>
      <linearGradient id="scanGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${palette.accent}" stop-opacity="0" />
        <stop offset=".5" stop-color="${palette.accent}" stop-opacity=".75" />
        <stop offset="1" stop-color="${palette.secondary}" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect class="bg" width="100%" height="100%" rx="10" />
    <text class="label" x="${padX}" y="28">${escapeXml(label)}</text>
    <text class="meta" x="${padX}" y="47">${total} contributions collected by ${escapeXml(login)}</text>
    <rect class="scan" x="${padX}" y="${gridY - 8}" width="42" height="${gridHeight + 16}" rx="10">
      <animate attributeName="x" values="${padX};${width - padX - 42};${padX}" dur="9s" repeatCount="indefinite" />
    </rect>
    ${grid}
    <path class="track" d="${runnerPath}" />
    ${sparks}
    <g transform="translate(-8 -8)">
      <animateMotion dur="14s" repeatCount="indefinite" rotate="auto" path="${runnerPath}" />
      <path class="runner-wing" d="M8 0 L14 16 L8 12 L2 16 Z" opacity=".9" />
      <circle class="runner-core" cx="8" cy="8" r="4.5" />
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
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
