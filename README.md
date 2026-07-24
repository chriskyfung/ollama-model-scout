# Ollama Model Scout

Comprehensive remote server monitoring and hardware inference performance evaluation portal for Ollama models.

## Features

- Smart search and filter matrix for models, capabilities, families, and quantization
- Remote Ollama API management with connection testing
- Local hardware simulation (GPU VRAM / System RAM) with real-time performance estimation
- Visual performance analysis: Context length vs. memory demand and inference speed
- Batch API connection testing with terminal-style logging
- Customizable table columns and multi-field sorting
- Mock fallback data for offline testing
- Persistent local storage for settings

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS 4
- Recharts 3
- Lucide React

## Quick Start

```bash
cd ollama-model-scout
pnpm install
pnpm dev
```

## Usage

1. Click **"伺服器與硬體設定"** to configure Ollama server URL and hardware specs
2. Browse models in the sortable, filterable table
3. Select a model to open the Tactical Deck:
   - Adjust context length with the slider
   - Monitor VRAM/RAM spillover progress bars
   - View performance charts showing memory demand and tokens/sec
4. Use **"批次測試雲端 API 連線"** to test remote model connectivity

## License

AGPL 3.0 - See [LICENSE](LICENSE) for details.