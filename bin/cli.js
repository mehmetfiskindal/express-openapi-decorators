#!/usr/bin/env node
// Entry point shim for the `express-openapi-decorators` CLI.
//
// The bin uses a fallback chain:
//   1. If the user runs `npx express-openapi-decorators ...` (npm/npx
//      auto-loads the local node_modules tree), the bundle's CJS
//      exports resolve to a CJS module. In that case the CLI's
//      direct in-process import works for plain JS configs.
//   2. For TypeScript configs, the user must run the CLI under a
//      TypeScript-aware loader. We document three options in the
//      README:
//        a) `npx tsx node_modules/@developersailor/express-openapi-decorators/bin/cli.js ...`
//        b) Add `"scripts": { "openapi": "tsx bin/cli.js generate ..." }` to package.json
//        c) Use a plain JS config (the README shows an example)
//
// The bin intentionally does NOT spawn a sub-process with
// `node --import tsx/esm`. That pattern is fragile when the user's
// project is a hybrid CJS+ESM package: the .ts config gets
// transformed by tsx's hook into ESM, but our package's CJS bundle
// can't `require()` ESM without creating a cycle, and tsx's
// programmatic `tsImport` has the same constraint when called from a
// CJS context.
'use strict';

const path = require('node:path');
const cliEntry = path.join(__dirname, '..', 'dist', 'cli', 'index.mjs');

import('file://' + cliEntry)
  .then((cliMod) => {
    const run = cliMod && cliMod.run;
    if (typeof run !== 'function') {
      console.error(
        'express-openapi-decorators: CLI bundle does not export a `run()` function.'
      );
      process.exit(1);
    }
    return run(process.argv);
  })
  .then(() => {
    process.exit(process.exitCode || 0);
  })
  .catch((err) => {
    console.error(
      'express-openapi-decorators: failed to run.\n' +
        'If your config is TypeScript, run via `npx tsx` or compile it first.\n' +
        'Underlying error: ' +
        (err && err.message ? err.message : String(err))
    );
    process.exit(1);
  });
