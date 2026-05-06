import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { renderContributionRunner, themes, variants } from "./render.mjs";

const username = getInput("username") || process.env.GITHUB_REPOSITORY_OWNER;
const token = getInput("token") || process.env.GITHUB_TOKEN;
const output = getInput("output") || "dist/contrib-runner.svg";
const title = getInput("title");
const themeName = getInput("theme") || "fire";
const variantName = getInput("variant") || "spaceship";
const theme = themes[themeName] || themes.fire;
const variant = variants[variantName] ? variantName : "spaceship";

if (!username) {
  throw new Error("username is required.");
}

if (!token) {
  throw new Error("token is required.");
}

const weeks = await fetchContributionWeeks(username, token);
const svg = renderContributionRunner({ username, weeks, title, theme, variant });

await mkdir(dirname(output), { recursive: true });
await writeFile(output, svg, "utf8");

console.log(`Generated ${output} for ${username} using ${variant}.`);

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
