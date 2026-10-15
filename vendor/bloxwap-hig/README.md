# Vendored HIG candidate packages

These are the unmodified `npm pack` outputs of the HIG release **dry run**, not
registry packages. HIG has no published npm release yet, so `apps/docs` installs
them through `file:` dependencies and the root `overrides` pin HIG's internal
`@bloxwap/hig-tokens`/`@bloxwap/hig-contracts` dependency to the same files.

- Source: [bloxwap/hig@7c67a07](https://github.com/bloxwap/hig/tree/7c67a07c) (0.1.0 candidate)
- Produced with: `npm ci && npm run build && npm run release:dry-run -- --channel candidate`
  (native TTFs regenerated first with `npm run generate:fonts`, as the dry run requires)
- Only the packages the docs import: `hig-tokens` (CSS variables), `hig-contracts`
  (dependency of `hig-react`), `hig-react` (control CSS and components)
- `SHA256SUMS` is verified by `npm run lint` (`.github/scripts/hig-check.mjs`)

The tokens tarball carries HIG's native TTF faces for React Native consumers. The
docs never import or serve them; web fonts come from `@bloxwap/font`, and
`scripts/check-export.mjs` fails if a `.ttf` reaches the static export.

Upgrade: rebuild the dry run from a reviewed HIG commit, replace these files and
`SHA256SUMS`, update the versions in `apps/docs/package.json` and root `overrides`,
then run `npm install`, `npm run lint`, `npm run docs:check`, `npm run docs:build`
and `npm run docs:smoke`. Replace with registry versions once HIG publishes.
Rollback: revert the adopting PR (restores the previous docs CSS and lockfile).
