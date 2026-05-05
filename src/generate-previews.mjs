import { mkdir, writeFile } from "node:fs/promises";
import { renderContributionRunner, themes, variants } from "./render.mjs";

const variantThemes = {
  runner: "fire",
  spaceship: "neon",
  train: "fire",
  rocket: "fire",
  pulse: "neon",
  miner: "ocean",
  scanner: "ocean",
  minecraft: "ocean",
};

await mkdir("examples", { recursive: true });

for (const variant of Object.keys(variants)) {
  const theme = themes[variantThemes[variant] || "fire"];
  const svg = renderContributionRunner({
    username: "WendellOttoni",
    weeks: createPreviewWeeks(),
    title: variants[variant].label,
    theme,
    variant,
  });
  await writeFile(`examples/${variant}.svg`, svg, "utf8");
}

await writeFile("examples/preview.svg", await readPrimaryPreview(), "utf8");

async function readPrimaryPreview() {
  const svg = renderContributionRunner({
    username: "WendellOttoni",
    weeks: createPreviewWeeks(),
    title: variants.runner.label,
    theme: themes.fire,
    variant: "runner",
  });
  return svg;
}

function createPreviewWeeks() {
  const start = new Date("2025-05-04T00:00:00Z");
  return Array.from({ length: 53 }, (_, weekIndex) => ({
    contributionDays: Array.from({ length: 7 }, (_, dayIndex) => {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + weekIndex * 7 + dayIndex);
      const wave = Math.abs(Math.sin((weekIndex + 2) * (dayIndex + 3) * 0.37));
      const burst = (weekIndex % 9 === 0 && dayIndex > 1) || (weekIndex % 13 === 4 && dayIndex < 5);
      const contributionCount = burst ? 8 + dayIndex : Math.round(wave * 5);
      return {
        date: day.toISOString().slice(0, 10),
        contributionCount,
      };
    }),
  }));
}
