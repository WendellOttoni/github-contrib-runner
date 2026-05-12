import { loadPrototypeRenderer } from "./prototype-renderer.mjs";

let renderFromPrototype;

function loadRenderer() {
  if (!renderFromPrototype) {
    renderFromPrototype = loadPrototypeRenderer("etch_a_sketch.html", "buildAdaptive");
  }
  return renderFromPrototype;
}

export function renderEtchASketchGrid(grid) {
  return loadRenderer()(grid);
}
