import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const rendererCache = new Map();

export function loadPrototypeRenderer(htmlFileName, exportName) {
  const cacheKey = `${htmlFileName}::${exportName}`;
  if (rendererCache.has(cacheKey)) {
    return rendererCache.get(cacheKey);
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const html = readFileSync(resolve(here, `../prototypes/${htmlFileName}`), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) {
    throw new Error(`Prototype script was not found in ${htmlFileName}.`);
  }

  const endMarker = "function regen(seed)";
  const endIndex = script.indexOf(endMarker);
  if (endIndex < 0) {
    throw new Error(`Prototype regen() marker was not found in ${htmlFileName}.`);
  }

  const rendererSource = script.slice(0, endIndex);
  const context = {};
  vm.runInNewContext(`${rendererSource}\nglobalThis.__exportedRenderer = ${exportName};`, context);
  const renderer = context.__exportedRenderer;
  if (typeof renderer !== "function") {
    throw new Error(`Renderer ${exportName} was not found in ${htmlFileName}.`);
  }

  rendererCache.set(cacheKey, renderer);
  return renderer;
}
