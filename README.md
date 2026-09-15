# README Canvas

An Obsidian-inspired canvas with React.

## Getting started

The project requires Node.js and pnpm. Install the dependencies first with `pnpm install`.
To start the application, run `pnpm dev` and open http://localhost:5173/.

## Features

- coordinate system
- zoomable canvas
- panning
- dragging and resizing
- text and link type
- grouping
- jump to canvas
- duplicate, delete
- snap to grid
- debug mode
- multiselect
- keyboard movement & shortcuts
- undo/redo
- context menu
- navigation guidance
- content becomes skeleton when zoomed out far

## Testing

Unit and component tests run with Vitest, React Testing Library, and jsdom.
End-to-end tests run in a real Chromium browser with Playwright.

After installing the project dependencies, install the Playwright browser once:

```bash
pnpm exec playwright install chromium
```

On Linux CI environments that do not provide the required browser system
dependencies, install them together with Chromium:

```bash
pnpm exec playwright install --with-deps chromium
```

The Playwright commands start and stop their own Vite development server on
`127.0.0.1:4173`, so `pnpm dev` does not need to run separately.

| Command | Purpose |
| --- | --- |
| `pnpm test` | Run all Vitest unit and component tests once |
| `pnpm test:e2e` | Run the Playwright end-to-end tests headlessly in Chromium |
| `pnpm test:e2e:ui` | Open Playwright UI for interactive test runs and debugging |
| `pnpm test:all` | Run the Vitest and Playwright suites together |
| `pnpm check` | Run Biome formatting and lint checks |
| `pnpm build` | Type-check the project and create a production build |


## Todo

- export to PDF option
- option to add images
- add fixed sizes for canvas and dynamic resize
