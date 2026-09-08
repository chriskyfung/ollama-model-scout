# Contributing to Ollama Model Scout

First off, thank you for considering contributing! It's people like you that make this project great.

## Where do I go from here?

- If you've found a bug, please [submit an issue](https://github.com/chriskyfung/ollama-model-scout/issues/new?template=bug_report.md).
- If you have a feature request, please [submit an issue](https://github.com/chriskyfung/ollama-model-scout/issues/new?template=feature_request.md).
- If you want to contribute code, please read the following sections.

## Contributing Code

### Setting up your environment

1.  Fork this repository to your own GitHub account.
2.  Clone your fork to your local machine: `git clone https://github.com/YOUR_USERNAME/ollama-model-scout.git`
3.  Navigate to the project directory: `cd ollama-model-scout`
4.  Install the development dependencies: `pnpm install`

### Making Changes

1.  Create a new branch for your changes: `git checkout -b feat/my-awesome-feature`
2.  Make your changes to the code.
3.  Before committing, make sure to lint your code: `pnpm lint`
4.  Ensure the project builds successfully: `pnpm build`
5.  Commit your changes with a descriptive commit message following [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add model performance chart export feature
```
6.  Push your changes to your fork: `git push origin feat/my-awesome-feature`

### Submitting a Pull Request

1.  Go to the original repository on GitHub: [https://github.com/chriskyfung/ollama-model-scout](https://github.com/chriskyfung/ollama-model-scout)
2.  Click the "New pull request" button.
3.  Select your fork and the branch with your changes.
4.  Provide a clear title and description for your pull request, explaining the "what" and "why" of your changes.
5.  Click "Create pull request".

We will review your pull request as soon as possible. Thank you for your contribution!

### Pull Request Checklist

- [ ] My code follows the project's style guidelines (`pnpm lint` passes).
- [ ] I have performed a self-review of my code.
- [ ] I have commented my code, particularly in hard-to-understand areas.
- [ ] I have made corresponding changes to the documentation.
- [ ] My changes generate no new ESLint or build errors.
- [ ] I have added tests that prove my fix is effective or that my feature works.

## Internationalization (i18n) & Translation

The UI supports 8 languages: **en** (primary/fallback), **zh-TW**, **zh-CN**, **ja**, **ko**, **es**, **fr**, **de**.

### How translations work

- All user-facing strings live in `src/i18n/locales/<lang>.json`.
- Components use the `useTranslation()` hook from `react-i18next` and reference keys like `t("nav.models")`.
- The English (`en`) file is the structural base — every other locale must contain the same keys.

### Adding a new language

1. Create `src/i18n/locales/<lang>.json` by copying `en.json` and translating every value.
2. Add the language to the `SUPPORTED_LANGUAGES` array in `src/i18n/languages.js` (with its native display name).
3. Register the locale in `src/i18n/index.js` resources.
4. Run `pnpm test` — the `tests/i18n.test.js` suite verifies that all locale files share an identical key structure (fails on missing keys).

### Translating an existing language

1. Open `src/i18n/locales/<lang>.json` and update the targeted values.
2. Run `pnpm test` to confirm key-structure parity.
3. Run `pnpm lint && pnpm build` before submitting.

### Key naming conventions

- Group by UI section: `nav.*`, `header.*`, `apiSettings.*`, `models.*`, `overclock.*`, `features.*`, `faq.*`, `footer.*`, `toast.*`, `logs.*`, `terminology.*`.
- Use dot notation for hierarchy (e.g., `models.filters.types.remote`).
- Dynamic data (model names, families, sizes from the Ollama API) is **not** translated — only static UI labels.

### Terminology reference

For consistent translations of domain-specific terms (e.g., "Spillover", "Sweet Spot", "OOM"), see the glossary in the project's i18n implementation plan (README/CONTRIBUTING in `docs/`).

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.
