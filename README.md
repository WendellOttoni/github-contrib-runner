# GitHub Contrib Runner

Generate a custom animated SVG from a GitHub contribution calendar.

This started as an alternative to the common Snake and Pac-Man profile animations. Instead of cloning either idea directly, it renders a contribution grid with a moving runner, scan light, pulse effects, and themeable colors.

## Usage

Create a workflow in your profile repository:

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

Then add this to your profile README:

```md
<img src="https://raw.githubusercontent.com/USERNAME/USERNAME/output/contrib-runner.svg" alt="Commit Runner contribution animation" />
```

## Inputs

| Name | Default | Description |
| --- | --- | --- |
| `username` | `${{ github.repository_owner }}` | GitHub username to render. |
| `token` | `${{ github.token }}` | Token used to read contribution data. |
| `output` | `dist/contrib-runner.svg` | Output SVG path. |
| `title` | `Commit Runner` | SVG title. |
| `theme` | `fire` | Theme name: `fire`, `neon`, or `ocean`. |

## Development

The action is dependency-free and runs with the Node.js version available on GitHub-hosted runners.

```bash
INPUT_USERNAME=WendellOttoni INPUT_TOKEN=ghp_example INPUT_OUTPUT=dist/contrib-runner.svg node src/cli.mjs
```

Never commit real GitHub tokens.
