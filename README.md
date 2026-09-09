<p align="center">
  <img src="https://raw.githubusercontent.com/chriskyfung/ollama-model-scout/main/public/favicon.svg" alt="Ollama Model Scout logo" width="120" style="border-radius: 24px;" />
</p>

<h1 align="center">Ollama Model Scout</h1>

<p align="center">
  Comprehensive remote server monitoring and hardware inference performance evaluation portal for Ollama models.
</p>

<p align="center">
  <a href="https://github.com/chriskyfung/ollama-model-scout/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/chriskyfung/ollama-model-scout/ci.yml?branch=main&label=CI&logo=github&style=flat" alt="CI status" /></a>
  <a href="https://github.com/chriskyfung/ollama-model-scout/blob/main/package.json"><img src="https://img.shields.io/github/package-json/v/chriskyfung/ollama-model-scout?label=version&logo=node.js&style=flat" alt="Version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/chriskyfung/ollama-model-scout?label=license&style=flat" alt="License" /></a>
  <a href="https://github.com/chriskyfung/ollama-model-scout/blob/main/package.json"><img src="https://img.shields.io/static/v1?label=node&message=%3E%3D22.22&color=026e00&logo=node.js&logoColor=white&style=flat" alt="Node.js &ge; 22" /></a>
  <img src="https://img.shields.io/static/v1?label=react&message=19&color=149eca&style=flat&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/static/v1?label=pnpm&message=11&color=f69220&style=flat&logo=pnpm&logoColor=white" alt="pnpm 11" />
  <a href="https://github.com/chriskyfung/ollama-model-scout"><img src="https://img.shields.io/github/languages/count/chriskyfung/ollama-model-scout?label=languages&style=flat" alt="Languages" /></a>
</p>

## Features

- Smart search and filter matrix for models, capabilities, families, and quantization
- Remote Ollama API management with connection testing
- Local hardware simulation (GPU VRAM / System RAM) with real-time performance estimation
- Visual performance analysis: Context length vs. memory demand and inference speed
- Cloud API batch connection diagnostics with terminal-style logging
- Multilingual interface supporting 8 languages with a built-in language switcher
- Accessible, keyboard-friendly interactive components (live-region test logs, focus-managed modals)
- Customizable table columns and multi-field sorting
- Mock fallback data for offline testing
- Persistent local storage for settings — 100% client-side, no user data leaves the browser

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS 4
- Recharts 3
- Lucide React + usehooks-ts
- i18next + react-i18next (8 locales)
- Vitest 5 + Testing Library 16 (unit, accessibility & smoke tests)
- ESLint 10

## Quick Start

```bash
cd ollama-model-scout
pnpm install
pnpm dev
```

### Scripts

| Script           | Description                                  |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | Start the Vite development server            |
| `pnpm build`     | Build the production bundle                  |
| `pnpm preview`   | Preview the production build locally         |
| `pnpm lint`      | Lint the codebase with ESLint                |
| `pnpm test`      | Run the test suite once (Vitest)             |
| `pnpm test:watch`| Run tests in watch mode                      |

## Usage

1. Click the **Server & Hardware** settings button to configure the Ollama server URL and hardware specs
2. Browse models in the sortable, filterable matrix
3. Select a model to open the Tactical Deck:
   - Adjust context length with the slider
   - Monitor VRAM/RAM spillover progress bars
   - View performance charts showing memory demand and tokens/sec
4. Use **Batch Test Cloud APIs** to test remote model connectivity
5. Switch the interface language at any time with the language switcher

## License

AGPL 3.0 - See [LICENSE](LICENSE) for details.
