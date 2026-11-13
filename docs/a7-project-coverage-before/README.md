# A7 full Node baseline coverage

Tool: `c8` with `--all`, measuring V8 line and branch coverage across all 7,919 compiled VS Code core source files under `out/vs` while excluding test files. The generated report is `coverage-summary.json`; its paths were normalized to repository relative paths for portability.

The baseline used the original compiled `webviewPortMapping.ts` and excluded the three new A7 test files from the runner's discovery path. The complete Node unit suite passed in two workers: 31,870 passing, 243 pending in total.

Command: `VSCODE_PID=1 node_modules/.bin/c8 --all --src out/vs --include='out/vs/**/*.js' --exclude='out/vs/**/test/**' --reporter=text-summary --reporter=json-summary --merge-async --reports-dir=docs/a7-project-coverage-before node test/unit/node/index.js --workers 2 --rerun-failed-files 2`

Coverage: 26.99% lines (610,198 / 2,260,569) and 84.27% branches (128,600 / 152,603). The figures include unexecuted compiled core files, but exclude built-in extensions and do not measure Electron or browser-only behavior.
