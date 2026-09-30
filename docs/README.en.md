# OpenCraft

An open resource commons for the AI era. Discover a design, preview it, take the prompt and source, then contribute your improvement.

The platform and its three original examples are MIT licensed. Community resources retain their declared licenses. Browsing and downloading do not require an account or paid membership.

## Start

Node.js 22.12+ is required.

```sh
npm ci
npm run dev
```

Check with `npm run validate`, `npm run check`, `npm test`, and `npm run build`. Install Playwright Chromium before `npm run test:e2e`.

Version 0.1 includes a searchable catalog, categories, detail pages, sandboxed previews, prompt copying, source downloads and a static JSON catalog at `api/resources.json`. The JSON endpoint is separate from the local read-only stdio MCP server, which now supports search, resource retrieval and contribution guidance. See [AI onboarding](AI.md) for the opt-in CLI that prepares or submits a scoped draft PR. A hosted remote MCP is not yet provided.

Resources live in `resources/*.json` and `public/examples/*.html`. Fork, add a self-contained HTML/CSS example with authorship and licensing, then open a pull request. See [CONTRIBUTING](../CONTRIBUTING.md). JavaScript and remote dependencies are outside the initial resource scope.

GitHub Actions checks contributions. Pages deployment is manual unless the repository variable `PAGES_ENABLED` is `true`. Enable Pages with GitHub Actions in repository settings first.
