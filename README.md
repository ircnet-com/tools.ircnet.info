# tools.ircnet.info

## Setup

This project is currently tied to the Angular 17 toolchain because
`angular-datatables@17.1.0` has Angular 17 peer dependencies. Use Node 20 for
local development; do not partially upgrade individual Angular packages.

With `nvm`:

```bash
nvm install 20
nvm use
npm ci
```

`npm ci` is intentional: it installs the exact dependency tree from
`package-lock.json` instead of re-resolving the Angular toolchain.

### Recover a clone with mixed Angular versions

If a local clone was partially upgraded (for example Angular 20/21 packages
mixed with the Angular 17 project), reset the dependency manifests and rebuild
`node_modules` from the lockfile:

```bash
git restore package.json package-lock.json
rm -rf node_modules
nvm use 20
npm ci
```

If the repository already contains this fix, pull/reset to that revision before
running the commands above.

## Development

Start the local development server with:

```bash
npm start
```

Then open `http://localhost:4200/`. The app reloads automatically when source
files change.

## Deployment

Deployment to [https://tools.ircnet.info](https://tools.ircnet.info) is handled
automatically by GitHub Actions after pushes to `main`.

## Further help

For Angular CLI help, use `npm run ng -- help` or see the Angular CLI
documentation.
