import { loadPrototypeRenderer } from "./prototype-renderer.mjs";

let renderFromPrototype;

function loadRenderer() {
  if (!renderFromPrototype) {
    renderFromPrototype = loadPrototypeRenderer("dungeon_crawler.html", "buildAdaptive");
  }
  return renderFromPrototype;
}

export function renderDungeonCrawlerGrid(grid) {
  return loadRenderer()(grid);
}
