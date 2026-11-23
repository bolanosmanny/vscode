# Local pull request draft: directional editor group resize

## Issue and problem

Addresses [microsoft/vscode#145890](https://github.com/microsoft/vscode/issues/145890). Existing Increase/Decrease Editor Width and Height commands do not name a boundary. In a left | middle | right grid, a baseline `Grid.resizeView(middle, { width: 360 })` changed widths from `[300, 300, 300]` to `[300, 360, 240]`; the right group shrank even when the desired change was toward the left.

**Upstream overlap:** [#296358](https://github.com/microsoft/vscode/pull/296358) and [#337462](https://github.com/microsoft/vscode/pull/337462) were both open on 2026-11-22 and address the same issue. This branch is local course work. Before any upstream proposal, discuss duplication and the current preferred design with the maintainers.

## Changes

- Add four localized Command Palette commands: `workbench.action.resizeEditorLeft`, `workbench.action.resizeEditorRight`, `workbench.action.resizeEditorUp`, and `workbench.action.resizeEditorDown`. Users may bind them in Keyboard Shortcuts. Each grows the active group's named edge by 60 CSS px.
- Route the command through `IEditorGroupsContainer` and the active editor part to `Grid.resizeViewInDirection`. The grid selects the nearest ancestor boundary on the requested side; SplitView moves only the two adjacent children and clamps to their size limits.
- Keep existing resize commands unchanged. Add grid and split-view unit coverage plus tests invoking the registered commands.
- Document the design, rejected neighbor-shrinking alternative, architectural placement, and AI assistance in companion files.

## Try it

1. Build and launch this branch of Code OSS. Open three editor groups side by side and make the middle group active.
2. Run **Resize Editor Left** from the Command Palette. The middle group grows into the left group; the right group keeps its width. Run **Resize Editor Right** to grow it into the right group.
3. Open three stacked groups and try **Resize Editor Up** and **Resize Editor Down** on the middle group.
4. Repeat at an outer edge or after a neighbor reaches its minimum size; the command should leave sizes unchanged. Create a nested layout by splitting the middle group below, then resize the lower-middle group left to move its column boundary.
5. To use the feature entirely by keyboard, assign command IDs to keys in Keyboard Shortcuts. No default shortcuts are introduced.

The command path is automated in a browser test; a live workbench walkthrough has not been performed in this session.

## Validation and exact output

| Command | Result |
| --- | --- |
| `pnpm run build-fast --client-only` | Passed; initial full client transpile: 11,648 files, resources: 2,411 files; later incremental rebuilds passed. |
| `node test/unit/browser/index.js --browser chromium --run src/vs/base/test/browser/ui/grid/grid.test.ts --run src/vs/workbench/services/editor/test/browser/editorGroupsService.test.ts --grep 'directional' --reporter dot` | `5 passing (64ms)` before review additions. |
| `node test/unit/browser/index.js --browser chromium --run src/vs/base/test/browser/ui/grid/grid.test.ts --run src/vs/base/test/browser/ui/splitview/splitview.test.ts --run src/vs/workbench/services/editor/test/browser/editorGroupsService.test.ts --reporter dot` | `143 passing (1s)` before review additions; `145 passing (1s)` after them. |
| `pnpm run typecheck-client` | First run failed: `layoutActions.ts(1295,101): error TS2445: Property 'RESIZE_INCREMENT' is protected and only accessible within class 'BaseResizeViewAction' and its subclasses.` The command action now extends that base class; subsequent runs passed with exit code 0 and no diagnostics. |
| `pnpm run oxlint` on the 10 changed TypeScript files | `oxlint: checked 10 files in 1589ms with 1 process`; exit code 0. A final run on the three review-edited TypeScript files checked 3 files and passed. |
| `pnpm run hygiene` | Full repository check passed twice; final output: `Hygiene checked 14922 files in 12990ms.` There is no separate repository formatter script; hygiene is the project style check used here. |
| `./scripts/test.sh --reporter dot --timeout 10000` | Full Electron unit suite: `77126 passing (8m)`, `569 pending`; exit code 0. This run preceded the final two added tests and JSDoc clarification; the final affected Chromium suites and type check ran afterward. |
| `git diff --check` | Passed with no output. |

## Exclusions, compatibility, and reviewer questions

No configurable step, default keybinding, terminal-specific sizing, extension API, or new setting. The existing six resize commands retain their IDs and behavior. A group in an auxiliary editor part is resized within that part's grid; there is no cross-window boundary movement.

The principal compatibility risk is adding an operation to generic Grid, SplitView, and `IEditorGroupsContainer`. Existing implementations of the interface need the method; the test stub was updated. Saved layout format is unchanged. The main reviewer questions are whether a generic pairwise sash API is acceptable for this workbench use case, how maximized layouts should behave, and whether work should instead converge with upstream PR #337462.

This is a local draft only. No branch was pushed and no PR was opened.
