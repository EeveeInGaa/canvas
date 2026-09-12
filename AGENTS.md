# Working on Canvas

## Project overview

- The application is a React 19 canvas built with Vite and TypeScript.
- `src/main.tsx` mounts `src/App.tsx`. Canvas components, hooks, types, and pure utilities live in their corresponding top-level `src` directories.
- Base UI provides accessible headless primitives for popovers, accordions, and context menus.
- Tailwind CSS v4 is the primary styling system.
- The canvas workspace intentionally remains fixed at 800 by 600 pixels until responsive resizing is implemented as a separate feature.

## Commands

- `pnpm dev` starts the local development server.
- `pnpm build` runs TypeScript and creates the production bundle.
- `pnpm check` runs the read-only Biome checks.
- `pnpm check:fix` applies safe Biome formatting and lint fixes.
- `pnpm format` formats the project with Biome.

Run `pnpm check` and `pnpm build` after source changes. The project does not have an automated test suite yet, so verify affected canvas interactions manually.

## Code structure

- Keep UI components in `src/components`, stateful behavior in `src/hooks`, shared types in `src/types`, and pure calculations or state transformations in `src/utils`.
- Keep multi-file UI areas in a named subdirectory, as with `src/components/toolbar` and `src/components/context-menu`.
- Keep the public canvas interaction facade in `src/hooks/useCanvasInteractions.ts`; lifecycle-specific pointer hooks belong in `src/hooks/interactions`.
- Keep React components focused on rendering and event wiring. Move reusable state transitions and geometry calculations into hooks or pure domain modules.
- Split files by responsibility when a component or hook coordinates unrelated behaviors. Avoid creating one-file abstractions for trivial values.
- Prefer named exports, the `@/` alias for cross-directory imports, and extensionless TypeScript imports.
- Preserve existing canvas behavior when restructuring: node creation and editing, selection, grouping, dragging, resizing, panning, zooming, snapping, keyboard shortcuts, context menus, and undo/redo.

## Styling

- Use Tailwind utilities for static layout, spacing, typography, colors, borders, and component states.
- Define shared design values as semantic Tailwind theme tokens in `src/index.css`.
- Use plain CSS when selectors, Base UI state styling, or animations are clearer there than in a long utility string.
- Keep inline styles for values calculated at runtime, including node geometry, selection rectangles, grid offsets, and viewport transforms.
- Do not add responsive canvas sizing until that feature is explicitly requested.

## Repository workflow

- Biome is the only formatter and linter.
- Do not add a second linting or formatting tool.
- Do not commit changes unless the user explicitly asks for a commit.
- Preserve unrelated changes already present in the working tree.
