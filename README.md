# GitHub Contrib Runner

Generate a custom animated SVG from a GitHub contribution calendar.

This started as an alternative to the common Snake and Pac-Man profile animations. Instead of cloning either idea directly, it renders a contribution grid with a moving runner, scan light, pulse effects, and themeable colors.

## Preview Gallery

### Commit Runner

![Commit Runner preview](examples/runner.svg)

### Commit Invaders

![Commit Invaders preview](examples/spaceship.svg)

### Train Code

![Train Code preview](examples/train.svg)

### Rocket Trail

![Rocket Trail preview](examples/rocket.svg)

### Data Pulse

![Data Pulse preview](examples/pulse.svg)

### Code Miner

![Code Miner preview](examples/miner.svg)

### Laser Scanner

![Laser Scanner preview](examples/scanner.svg)

## Usage

Create this workflow in `.github/workflows/contrib-runner.yml`:

```yml
name: Commit Runner Animation

on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  generate:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - name: Generate Commit Runner animation
        uses: WendellOttoni/github-contrib-runner@main
        with:
          username: ${{ github.repository_owner }}
          variant: runner
          theme: fire
          output: dist/contrib-runner.svg

      - name: Push output to dist branch
        uses: crazy-max/ghaction-github-pages@v3
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Then add the generated SVG to your README:

```md
<img src="https://raw.githubusercontent.com/USERNAME/USERNAME/output/contrib-runner.svg" alt="Commit Runner contribution animation" />
```

For example, in this profile repository:

```md
<img src="https://raw.githubusercontent.com/WendellOttoni/WendellOttoni/output/contrib-runner.svg" alt="Commit Runner contribution animation" />
```

## Examples

### Test in Any Repository

You do not need to test it directly in your profile README. Create any repository, add the workflow above, run it from the **Actions** tab, and point the README image to that repository:

```md
<img src="https://raw.githubusercontent.com/WendellOttoni/teste-contrib-runner/output/contrib-runner.svg" alt="Commit Runner contribution animation" />
```

The SVG is generated from the `username` input, not from the repository where the workflow runs. That means a test repository can render your real contribution calendar:

```yml
- name: Generate Commit Runner animation
  uses: WendellOttoni/github-contrib-runner@main
  with:
    username: WendellOttoni
    variant: rocket
    theme: fire
  output: dist/contrib-runner.svg
```

## Prototypes

The `prototypes/` directory contains standalone HTML generators used to explore new animation concepts before they become Action variants.

| Prototype | File | Status |
| --- | --- | --- |
| Commit Invaders | `prototypes/commit_invaders.html` | Ported to `variant: spaceship`. |
| Code Miner Minecraft | `prototypes/code_miner_minecraft.html` | Prototype. |
| Hash Cracker | `prototypes/hash_cracker.html` | Prototype. |
| Build Pipeline | `prototypes/build_pipeline.html` | Prototype. |
| City Skyline | `prototypes/city_skyline.html` | Prototype. |
| Constellation | `prototypes/constellation.html` | Prototype. |
| Etch-a-Sketch | `prototypes/etch_a_sketch.html` | Prototype. |

Open any prototype directly in a browser to preview it and download the generated SVG. Once a prototype is stable, its SVG renderer can be ported into `src/render.mjs` and exposed through the `variant` input.

### Variants

Choose one of these values with the `variant` input:

| Variant | Concept |
| --- | --- |
| `runner` | Energy cursor crossing active days. |
| `spaceship` | Space Invaders style ship shooting contribution blocks from below. |
| `train` | Tiny train moving through the commit line. |
| `rocket` | Rocket leaving a trail over contribution peaks. |
| `pulse` | Signal activating the calendar as it travels. |
| `miner` | Miner collecting contribution blocks. |
| `scanner` | Scanner reading contribution intensity. |

```yml
with:
  username: WendellOttoni
  variant: spaceship
  theme: neon
  title: Commit Invaders
  output: dist/contrib-runner.svg
```

### Themes

Use `fire` to match orange/red profile designs:

```yml
with:
  username: WendellOttoni
  variant: runner
  theme: fire
  title: Commit Runner
  output: dist/contrib-runner.svg
```

Use `neon` for a cyan/purple style:

```yml
with:
  username: WendellOttoni
  variant: pulse
  theme: neon
  title: Neon Runner
  output: dist/contrib-runner.svg
```

Use `ocean` for a blue/cyan style:

```yml
with:
  username: WendellOttoni
  variant: scanner
  theme: ocean
  title: Ocean Runner
  output: dist/contrib-runner.svg
```

### Custom Output File

You can generate more than one variant by calling the action multiple times:

```yml
- name: Generate fire animation
  uses: WendellOttoni/github-contrib-runner@main
  with:
    username: WendellOttoni
    variant: rocket
    theme: fire
    output: dist/contrib-runner-fire.svg

- name: Generate neon animation
  uses: WendellOttoni/github-contrib-runner@main
  with:
    username: WendellOttoni
    variant: spaceship
    theme: neon
    output: dist/contrib-runner-neon.svg
```

## Inputs

| Name | Default | Description |
| --- | --- | --- |
| `username` | `${{ github.repository_owner }}` | GitHub username to render. |
| `token` | `${{ github.token }}` | Token used to read contribution data. |
| `output` | `dist/contrib-runner.svg` | Output SVG path. |
| `title` | Variant label | SVG title. |
| `theme` | `fire` | Theme name: `fire`, `neon`, or `ocean`. |
| `variant` | `runner` | Animation variant: `runner`, `spaceship`, `train`, `rocket`, `pulse`, `miner`, or `scanner`. |

## Development

The action is dependency-free and runs with the Node.js version available on GitHub-hosted runners.

```bash
INPUT_USERNAME=WendellOttoni INPUT_TOKEN=ghp_example INPUT_VARIANT=rocket INPUT_OUTPUT=dist/contrib-runner.svg node src/cli.mjs
```

Never commit real GitHub tokens.

Generate the preview gallery with simulated data:

```bash
node src/generate-previews.mjs
```
