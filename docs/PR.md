# Local pull request draft: directional editor group resize

## Issue and problem

Addresses [microsoft/vscode#145890](https://github.com/microsoft/vscode/issues/145890). Existing Increase/Decrease Editor Width and Height commands do not name a boundary. In a left | middle | right grid, a baseline `Grid.resizeView(middle, { width: 360 })` changed widths from `[300, 300, 300]` to `[300, 360, 240]`; the right group shrank even when the desired change was toward the left.

**Upstream influence:** [PR #337462](https://github.com/microsoft/vscode/pull/337462) substantially influenced this AI-written local adaptation. The nearest-ancestor grid search, adjacent-child sash movement, service route, and command IDs closely follow that open proposal; its optional increment argument is excluded here. [PR #296358](https://github.com/microsoft/vscode/pull/296358), also open on 2026-11-22, informed the rejected neighboring-group alternative. This work should not be described as an independent upstream solution. Before any upstream proposal, discuss duplication and the current preferred design with the maintainers.

## Changes

- Add four localized Command Palette commands: `workbench.action.resizeEditorLeft`, `workbench.action.resizeEditorRight`, `workbench.action.resizeEditorUp`, and `workbench.action.resizeEditorDown`. Users may bind them in Keyboard Shortcuts. Each grows the active group's named edge by 60 CSS px.
- Route the command through `IEditorGroupsContainer` and the active editor part to `Grid.resizeViewInDirection`. The grid selects the nearest ancestor boundary on the requested side; SplitView moves only the two adjacent children and clamps to their size limits.
- Keep existing resize commands unchanged. Add grid and split-view unit coverage plus tests invoking the registered commands.
- Document the design, rejected neighbor-shrinking alternative, architectural placement on the existing logical diagram, and AI assistance in companion files.

## Try it

1. Build and launch this branch of Code OSS. Open three editor groups side by side and make the middle group active.
2. Run **Resize Editor Left** from the Command Palette. The middle group grows into the left group; the right group keeps its width. Run **Resize Editor Right** to grow it into the right group.
3. Open three stacked groups and try **Resize Editor Up** and **Resize Editor Down** on the middle group.
4. Repeat at an outer edge or after a neighbor reaches its minimum size; the command should leave sizes unchanged. Create a nested layout by splitting the middle group below, then resize the lower-middle group left to move its column boundary.
5. To use the feature entirely by keyboard, assign command IDs to keys in Keyboard Shortcuts. No default shortcuts are introduced.

The registered command handler path is automated in a browser test;

The registered command handlers are covered by browser tests. I also tested the commands in a live Code - OSS window with three columns and a nested middle column; the named boundary moved as expected, and the outer-edge command did nothing.
## Validation and exact output

| Command | Result |
| --- | --- |
| `pnpm run build-fast --client-only` | Passed; initial full client transpile: 11,648 files, resources: 2,411 files; later incremental rebuilds passed. |
| `pnpm run build-fast` | An earlier attempt did not complete: the Copilot build lane failed after the extension lane built. The exact diagnostic was not retained in this audit, so this is not reported as a passing build. The client-only build above is the relevant workbench output check. |
| `node test/unit/browser/index.js --browser chromium --run src/vs/base/test/browser/ui/grid/grid.test.ts --run src/vs/workbench/services/editor/test/browser/editorGroupsService.test.ts --grep 'directional' --reporter dot` | `5 passing (64ms)` before review additions. |
| `node test/unit/browser/index.js --browser chromium --run src/vs/base/test/browser/ui/grid/grid.test.ts --run src/vs/base/test/browser/ui/splitview/splitview.test.ts --run src/vs/workbench/services/editor/test/browser/editorGroupsService.test.ts --reporter dot` | Latest focused rerun after the one test and an added command assertion: `146 passing (1s)`; exit code 0. The first sandboxed attempt failed with `listen EPERM: operation not permitted ::1`; the approved retry passed. |
| `pnpm run typecheck-client` | Final audit rerun: `$ tsc --project ./src/tsconfig.json --noEmit --skipLibCheck`; exit code 0, no diagnostics. An earlier run failed with `TS2445` before the action was changed to extend the existing base class. |
| `pnpm run oxlint` on all 11 changed TypeScript files listed by `git diff main --name-only` | Final audit rerun: `oxlint: checked 11 files in 599ms with 1 process (the slowest took 362ms).`; exit code 0. |
| `pnpm run hygiene` | Final audit rerun: `Hygiene checked 14922 files in 7814ms.`; exit code 0. There is no separate repository formatter script; hygiene is the project style check used here. |
| `./scripts/test.sh --reporter dot --timeout 10000` | Final full Electron unit suite, run after the newest test edits: `77129 passing (8m)`, `569 pending`; exit code 0. |
| `git diff --check` | Passed with no output. |

## Exclusions, compatibility, and reviewer questions

No configurable step, default keybinding, terminal-specific sizing, extension API, or new setting. The existing six resize commands retain their IDs and behavior. A group in an auxiliary editor part is resized within that part's grid; there is no cross-window boundary movement.

The principal compatibility risk is adding an operation to generic Grid, SplitView, and `IEditorGroupsContainer`. Existing implementations of the interface need the method; the test stub was updated. Saved layout format is unchanged. The main reviewer questions are whether a generic pairwise sash API is acceptable for this workbench use case, how maximized layouts should behave, and whether work should instead converge with upstream PR #337462.

I reviewed the command-to-grid path, identified three improvements that Codex implemented, checked the resulting diff, and completed a live Code - OSS walkthrough.
