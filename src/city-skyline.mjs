import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

let renderFromPrototype;

function loadRenderer() {
  if (renderFromPrototype) return renderFromPrototype;

  const here = dirname(fileURLToPath(import.meta.url));
  const html = readFileSync(resolve(here, "../prototypes/city_skyline.html"), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) {
    throw new Error("City Skyline prototype script was not found.");
  }

  const rendererSource = script.slice(0, script.indexOf("function regen(seed)"));
  const context = {};
  vm.runInNewContext(`${rendererSource}\nglobalThis.__renderCitySkyline = buildAdaptive;`, context);
  renderFromPrototype = context.__renderCitySkyline;
  return renderFromPrototype;
}

export function renderCitySkylineGrid(grid) {
  return loadRenderer()(grid);
}
