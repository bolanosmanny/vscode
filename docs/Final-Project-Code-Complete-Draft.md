# Final Project: Code Complete — draft

**Status:** AI-written local draft for the project owner's review. This page has not been published to the wiki or submitted to OAKS.

## Project and acceptance criteria

The CSCI 360 Final Project Part 1 branch `feature/directional-editor-resize` addresses [microsoft/vscode#145890](https://github.com/microsoft/vscode/issues/145890). The feature provides four commands that grow the active editor group's left, right, top, or bottom edge by moving the corresponding grid boundary. In a three-column grid, Left on middle changes the left and middle widths while leaving the right width unchanged. At missing boundaries or size limits, it does nothing. Nested layouts use the nearest ancestor boundary on the named side. Existing resize commands continue to work. This AI-written adaptation was substantially influenced by open [PR #337462](https://github.com/microsoft/vscode/pull/337462).

The assignment criteria supplied for this work were: changes to existing files; a meaningful design choice and rejected alternative; extension of a public command, interface, model, or configuration; unit tests and a test through the user-facing path; enough substance for maintainer review. This branch changes existing grid and workbench files, extends `IEditorGroupsContainer` and command registration, and tests both the grid primitive and registered commands.

## Project rules that affected the work

The following are exact quotations from VS Code's repository instructions and PR template. They constrained the code, validation, and draft PR:

> “We use tabs, not spaces.” — `.github/copilot-instructions.md`, Indentation

> “All strings visible to the user need to be externalized using the `vs/nls` module” — `.github/copilot-instructions.md`, Strings

> “Prefer `pnpm run oxlint <changed files>` for targeted linting.” — `.github/copilot-instructions.md`, Validating TypeScript changes

> “Use `scripts/test.sh` (or `scripts\test.bat` on Windows) for unit tests and `scripts/test-integration.sh` (or `scripts\test-integration.bat` on Windows) for integration tests.” — `.github/copilot-instructions.md`, Validating TypeScript changes

> “Associate an issue with the Pull Request.” — `.github/pull_request_template.md`

> “Include a description of the proposed changes and how to test them.” — `.github/pull_request_template.md`

`CONTRIBUTING.md` directs contributors to the [VS Code pull request guidance](https://github.com/microsoft/vscode/wiki/How-to-Contribute#pull-requests). That guidance asks for one PR per issue, small changes, and tests when possible; it requires a Contributor License Agreement before an upstream PR can be accepted. I found no DCO sign-off requirement in the inspected repository instructions or PR guidance. Two open PRs already address this issue, so the owner should decide whether any upstream proposal is appropriate after comparing them.

## Work and design decision

The design note was committed first. The rejected alternative, reflected in [PR #296358](https://github.com/microsoft/vscode/pull/296358), was to find a neighboring editor group and shrink it with `setSize`. That approach cannot promise which grid sash moves in a nested layout. The chosen design follows [PR #337462](https://github.com/microsoft/vscode/pull/337462) in finding the nearest boundary in the grid tree and moving only the two children beside that sash. `SplitView` owns minimum and maximum constraints; the command handler supplies direction and the existing 60 px step. PR #337462 additionally supports an optional command increment argument, which this branch excludes. This audit marked the feature path on the existing [logical architecture diagram](Logical-Architecture.md).

Baseline reproduction before implementation: in a 900 px grid with three 300 px columns, `Grid.resizeView(middle, { width: 360 })` produced widths `[300, 360, 240]`, shrinking the right group. The new Left command's browser test checks `[left - 60, middle + 60, right unchanged]`.

## Actual validation output

```text
pnpm run build-fast --client-only
[transpile] Found 11648 files
[resources] Copied 2411 files
[build-fast] client finished in 4770ms

node test/unit/browser/index.js --browser chromium --run src/vs/base/test/browser/ui/grid/grid.test.ts --run src/vs/base/test/browser/ui/splitview/splitview.test.ts --run src/vs/workbench/services/editor/test/browser/editorGroupsService.test.ts --reporter dot
146 passing (1s)

pnpm run typecheck-client
$ tsc --project ./src/tsconfig.json --noEmit --skipLibCheck
exit code 0

pnpm run oxlint src/vs/base/browser/ui/grid/grid.ts src/vs/base/browser/ui/grid/gridview.ts src/vs/base/browser/ui/splitview/splitview.ts src/vs/base/test/browser/ui/grid/grid.test.ts src/vs/base/test/browser/ui/splitview/splitview.test.ts src/vs/workbench/browser/actions/layoutActions.ts src/vs/workbench/browser/parts/editor/editorPart.ts src/vs/workbench/browser/parts/editor/editorParts.ts src/vs/workbench/services/editor/common/editorGroupsService.ts src/vs/workbench/services/editor/test/browser/editorGroupsService.test.ts src/vs/workbench/test/browser/workbenchTestServices.ts
oxlint: checking 11 requested targets.
oxlint: checked 11 files in 599ms with 1 process (the slowest took 362ms).

pnpm run hygiene
Hygiene checked 14922 files in 7814ms.

./scripts/test.sh --reporter dot --timeout 10000
77129 passing (8m)
569 pending
exit code 0
```

An initial type check failed with `TS2445` because a protected resize-step constant was accessed from an unrelated class. The action was changed to extend the existing base class; the final type check passed. I reran the full Electron unit suite after the newest test edits; it exited with code 0. The first sandboxed Chromium attempt in the final audit failed with `listen EPERM: operation not permitted ::1`; the approved retry passed.

I ran Code - OSS and tested the commands in a three-column layout. With the middle group active, Resize Editor Left widened the middle group, narrowed the left group, and left the right group unchanged. Resize Editor Right affected only the middle and right groups. Resize Editor Left did nothing when the leftmost group was active. In a nested layout with two groups in the middle column, Resize Editor Up changed only their heights, and Resize Editor Left widened the middle column while leaving the right column unchanged.

An earlier `pnpm run build-fast` attempt failed in the Copilot build lane; its exact diagnostic was not retained here. `pnpm run build-fast --client-only` passed for the changed workbench sources. The integration suite and full browser unit suite were not run.

## Diff review and self-review

Codex’s initial diff review led to a pairwise SplitView test, a maximized-grid test, and clearer interface and design documentation. Those changes were made by Codex.

I then traced the resize commands through the editor service, Grid, and SplitView and compared the tests with the documented behavior. I identified three improvements for Codex to evaluate: a test for a negative amount through the editor-group service, an assertion that Resize Editor Left does nothing at the leftmost edge, and a clearer explanation of positive and negative amounts in the Grid method comment. Codex implemented these changes, and I reviewed the resulting diff. The latest focused Chromium run reported 146 passing tests.

My main expected reviewer question is whether adding methods to the generic Grid and SplitView APIs is justified for these editor commands, especially because upstream PR #337462 already proposes a similar design.
