# Final Project: Code Complete — draft

**Status:** Local draft for my review. This page has not been published to the wiki or submitted to OAKS.

## Project and acceptance criteria

My CSCI 360 Final Project Part 1 branch `feature/directional-editor-resize` addresses [microsoft/vscode#145890](https://github.com/microsoft/vscode/issues/145890). The feature provides four commands that grow the active editor group's left, right, top, or bottom edge by moving the corresponding grid boundary. In a three-column grid, Left on middle changes the left and middle widths while leaving the right width unchanged. At missing boundaries or size limits, it does nothing. Nested layouts use the nearest ancestor boundary on the named side. Existing resize commands continue to work.

The assignment criteria supplied for this work were: changes to existing files; a meaningful design choice and rejected alternative; extension of a public command, interface, model, or configuration; unit tests and a test through the user-facing path; enough substance for maintainer review. This branch changes existing grid and workbench files, extends `IEditorGroupsContainer` and command registration, and tests both the grid primitive and registered commands.

## Project rules that affected the work

The following are short exact quotations from the project instructions supplied for this task:

> “DESIGN BEFORE CODE. Write docs/DESIGN.md and commit it by itself before changing production code or tests.”

> “Do not pop my stash or bring unrelated assignment files onto this branch.”

> “Never report a test as passing if it was not run.”

> “Do not push, publish the wiki, open a PR, or submit anything to OAKS.”

Repository guidance in `.github/copilot-instructions.md` also required “Use `scripts/test.sh` ... for unit tests” and “Prefer `pnpm run oxlint <changed files>` for targeted linting.” The [VS Code contribution guidance](https://github.com/microsoft/vscode/wiki/How-to-Contribute#pull-requests) asks for one PR per issue, small changes, and tests where possible. Two open upstream PRs already address this issue, so a new upstream PR would require coordination.

## Work and design decision

The design note was committed first. The rejected alternative was to find a neighboring editor group and shrink it with `setSize`. That approach cannot promise which grid sash moves in a nested layout. The chosen design finds the nearest boundary in the grid tree and moves only the two children beside that sash. `SplitView` owns minimum and maximum constraints; the command handler supplies direction and the existing 60 px step.

Baseline reproduction before implementation: in a 900 px grid with three 300 px columns, `Grid.resizeView(middle, { width: 360 })` produced widths `[300, 360, 240]`, shrinking the right group. The new Left command's browser test checks `[left - 60, middle + 60, right unchanged]`.

## Actual validation output

```text
pnpm run build-fast --client-only
[transpile] Found 11648 files
[resources] Copied 2411 files
[build-fast] client finished in 4770ms

node test/unit/browser/index.js --browser chromium --run src/vs/base/test/browser/ui/grid/grid.test.ts --run src/vs/base/test/browser/ui/splitview/splitview.test.ts --run src/vs/workbench/services/editor/test/browser/editorGroupsService.test.ts --reporter dot
145 passing (1s)

pnpm run typecheck-client
$ tsc --project ./src/tsconfig.json --noEmit --skipLibCheck
exit code 0

pnpm run oxlint [10 changed TypeScript paths]
oxlint: checked 10 files in 1589ms with 1 process (the slowest took 1029ms).

pnpm run hygiene
Hygiene checked 14922 files in 12990ms.

./scripts/test.sh --reporter dot --timeout 10000
77126 passing (8m)
569 pending
exit code 0
```

An initial type check failed with `TS2445` because a protected resize-step constant was accessed from an unrelated class. The action was changed to extend the existing base class; later type checks passed. The full Electron run occurred before two review-added tests, which were covered by the final Chromium run. No live workbench or screen reader walkthrough was performed.

## Self-review notes and demonstration

The line-by-line `git diff main...feature/directional-editor-resize` review led to three improvements: a direct pairwise SplitView test including maximum-size clamping; a maximized-grid regression test; and clearer interface/design documentation of no-op and auxiliary-part behavior. The generic SplitView/Grid API expansion is the most likely maintainer concern, especially since [#337462](https://github.com/microsoft/vscode/pull/337462) already proposes a similar design. [#296358](https://github.com/microsoft/vscode/pull/296358) is another open PR for the same issue. A future reviewer should compare the approaches before any upstream proposal.

For my own demonstration, build this branch of Code OSS, create left | middle | right groups, focus middle, and run **Resize Editor Left** and **Resize Editor Right** from the Command Palette. Observe which neighbor shrinks. Try stacked and nested layouts, a missing edge, and a neighbor at minimum size. In Keyboard Shortcuts, assign any unused keys to the four command IDs to demonstrate keyboard access.

This draft and code were produced with AI assistance. I still need to personally inspect the code, run the manual demonstration, and record any changes I make before claiming them as my own review.
