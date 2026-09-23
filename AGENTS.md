# Working on Canvas

## Project overview

- The application is a React 19 canvas built with Vite and TypeScript.
- `src/main.tsx` mounts `src/App.tsx`. Canvas components, hooks, types, and pure utilities live in their corresponding top-level `src` directories.
- Base UI provides accessible headless primitives for popovers, accordions, and context menus.
- Tailwind CSS v4 is the primary styling system.
- The canvas workspace fills the browser viewport. Browser resizing must not move the camera or existing nodes in canvas coordinates.

## Commands

- `pnpm dev` starts the local development server.
- `pnpm build` runs TypeScript and creates the production bundle.
- `pnpm check` runs the read-only Biome checks.
- `pnpm check:fix` applies safe Biome formatting and lint fixes.
- `pnpm format` formats the project with Biome.
- `pnpm test` runs the Vitest unit and component tests.
- `pnpm test:e2e` runs the Playwright interaction tests in Chromium.
- `pnpm test:all` runs both test suites.

Run `pnpm check`, `pnpm test`, and `pnpm build` after source changes. Run `pnpm test:e2e` after changes to canvas interactions, keyboard behavior, focus management, viewport behavior, menus, editing, grouping, locking, or undo/redo. Add regression coverage for every fixed bug. Manually verify accessibility and interactions that automated tests cannot represent reliably.

## Code structure

- Keep UI components in `src/components`, stateful behavior in `src/hooks`, shared types in `src/types`, and pure calculations or state transformations in `src/utils`.
- Keep multi-file UI areas in a named subdirectory, as with `src/components/toolbar` and `src/components/context-menu`.
- Keep the public canvas interaction facade in `src/hooks/useCanvasInteractions.ts`; lifecycle-specific pointer hooks belong in `src/hooks/interactions`.
- Keep React components focused on rendering and event wiring. Move reusable state transitions and geometry calculations into hooks or pure domain modules.
- Split files by responsibility when a component or hook coordinates unrelated behaviors. Avoid creating one-file abstractions for trivial values.
- Prefer named exports, the `@/` alias for cross-directory imports, and extensionless TypeScript imports.
- Preserve existing canvas behavior when restructuring: node creation and editing, selection, grouping, dragging, resizing, panning, zooming, snapping, keyboard shortcuts, context menus, and undo/redo.
- Preserve object identity when a state transition makes no semantic change. No-op interactions must not create undo entries or trigger document-wide rerenders.
- Treat `pointerup` as completion and `pointercancel` as cancellation. Cancellation must restore the interaction's starting state.
- Keep high-frequency pointer work bounded to one visual update per animation frame where practical. Precompute reusable node lookup maps and geometry rather than rebuilding them once per group.

## Interaction and accessibility requirements

- Every pointer-only canvas action needs a discoverable keyboard alternative unless the action is inherently spatial and an equivalent command is provided elsewhere.
- Custom interactive canvas elements must be focusable, visibly focused, named for assistive technology, and implement the keyboard behavior promised by their ARIA role.
- Use `role="application"` only for a complete application-style focus and keyboard model. Do not nest application roles around native form controls.
- Form controls require persistent programmatic labels. Placeholders are examples, not labels.
- Do not remove a native focus outline without an equally visible `:focus-visible` replacement.
- Keep keyboard shortcuts inactive while users edit text, except for explicitly documented global commands. Reset transient key state when the window loses focus.
- Modifier-assisted marquee selection must preserve and combine with the selection that existed when the gesture started.
- Validate and normalize user-provided link URLs before rendering navigable anchors. Editing a link must not activate it.

## Styling

- Use Tailwind utilities for static layout, spacing, typography, colors, borders, and component states.
- Define shared design values as semantic Tailwind theme tokens in `src/index.css`.
- Use plain CSS when selectors, Base UI state styling, or animations are clearer there than in a long utility string.
- Keep inline styles for values calculated at runtime, including node geometry, selection rectangles, grid offsets, and viewport transforms.
- Preserve the full-viewport layout. Do not add JavaScript-driven layout measurement where CSS sizing is sufficient.
- Maintain WCAG 2.2 AA contrast: at least 4.5:1 for normal text and 3:1 for visual boundaries or states needed to identify controls.
- Honor `prefers-reduced-motion` for nonessential transitions and animations.

## Repository workflow

- Biome is the only formatter and linter.
- Do not add a second linting or formatting tool.
- Do not commit changes unless the user explicitly asks for a commit.
- Preserve unrelated changes already present in the working tree.

## Code

- Use current React and web platform best practices.
- Change only what is needed for the requested behavior.
- Keep code readable, maintainable, and performant.
