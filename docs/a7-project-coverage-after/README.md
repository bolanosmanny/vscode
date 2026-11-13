# A7 full Node final coverage

Tool: `c8` with `--all`, measuring V8 line and branch coverage across all 7,919 compiled VS Code core source files under `out/vs` while excluding test files. The generated report is `coverage-summary.json`; its paths were normalized to repository relative paths for portability.

The final run used the refactored port mapping code and all three new A7 test files. The complete Node unit suite passed in two workers: 31,880 passing, 243 pending in total. The new webview regression test and nine characterization tests account for the ten added passing tests.

Command: `VSCODE_PID=1 node_modules/.bin/c8 --all --src out/vs --include='out/vs/**/*.js' --exclude='out/vs/**/test/**' --reporter=text-summary --reporter=json-summary --merge-async --reports-dir=docs/a7-project-coverage-after node test/unit/node/index.js --workers 2 --rerun-failed-files 2`

Coverage: 26.99% lines (610,269 / 2,260,571) and 84.26% branches (128,544 / 152,545). The figures include unexecuted compiled core files, but exclude built-in extensions and do not measure Electron or browser-only behavior.
