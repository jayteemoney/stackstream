# Contributing

## Branch model

We use three layers of branches:

```
feature/fix branch  ->  staging  ->  main
   (local work)        (QA/verify)   (production)
```

| Branch | Purpose | Direct pushes | Merges into it |
| --- | --- | --- | --- |
| Work branches (`feat/...`, `fix/...`, `chore/...`, `docs/...`) | Day-to-day development | Allowed by the author | — |
| `staging` | Integration and testing ground | Blocked | Work branches via PR |
| `main` | Production | Blocked | `staging` only, via PR |

`main` is production. Nothing is merged into `main` until it has run on `staging`.

## Day-to-day flow

1. Create a work branch off the latest `staging` (not `main`):

   ```bash
   git fetch origin
   git switch -c feat/my-change origin/staging
   ```

2. Make changes and run the checks locally:

   ```bash
   npm ci
   npm ci --prefix frontend
   npm ci --prefix openclaw-service
   ./scripts/ci.sh all
   ```

3. Push the branch and open a pull request **targeting `staging`**:

   ```bash
   git push -u origin feat/my-change
   gh pr create --base staging --fill
   ```

4. Get the required checks green, then merge into `staging`.

5. Verify the change on the staging deployment (or locally from `staging`).

## Promoting to production

Once `staging` is verified and fit for release:

1. Open a promotion pull request from `staging` into `main`:

   ```bash
   gh pr create --base main --head staging --title "Promote staging to production" --fill
   ```

2. Two guards reject any PR into `main` whose source branch is not `staging`:
   the `Promotion guard` check (when GitHub Actions is available) and
   `scripts/vercel-promotion-guard.mjs` in the Vercel install step (always).

3. Get the required checks green, then merge. `main` deploys to production.

## Staging environment

`staging` is deployed to <https://staging.stackstream.xyz> and runs against
Stacks **testnet**, not mainnet. All other Vercel preview deployments (work
branches) also run against testnet; only production (`main`) runs against
mainnet.

The testnet configuration is stored as preview-scoped Vercel environment
variables, so it applies to `staging` and every other preview deployment:

- `NEXT_PUBLIC_NETWORK=testnet`
- `NEXT_PUBLIC_CONTRACT_DEPLOYER=ST36MRYTKD8X92Q6386RA9QV62A14NJMM9D9DYM3V`

`NEXT_PUBLIC_CHAIN_ID` and `NEXT_PUBLIC_RPC_URL` are not read by the frontend.

The testnet contracts are deployed with:

```bash
clarinet deployments generate --testnet --medium-cost
clarinet deployments apply --testnet -d --no-dashboard
```

The deployer mnemonic lives in the gitignored `settings/Testnet.toml`; never
commit it. Testnet STX comes from the
[Hiro faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet).

Staging is behind Vercel Authentication and is intentionally SSO-only while the
project is maintained by a single person. External testers can be added later
through **Deployment Protection Exceptions** when the team grows.

## Hotfixes

Hotfixes follow the same path: branch off `staging`, open a PR into `staging`,
verify, then promote `staging` to `main`. If production is broken and an
expedited release is unavoidable, an administrator may temporarily relax branch
protection for a `staging` to `main` promotion, but the fix must still pass the
Vercel promotion guard and be merged back into `staging` afterwards.

## CI

The checks live in `scripts/ci.sh` and run in two places:

- `.github/workflows/test.yml` runs them as three jobs on every pull request and
  on pushes to `staging` and `main`:
  - Contract and unit tests (`npm test`)
  - Frontend typecheck, lint, and production build
  - OpenClaw service typecheck
- Vercel runs `scripts/ci.sh all` as part of every deployment through
  `frontend/vercel.json`, so the required `Vercel` check covers the same three
  groups.
- The Vercel install step (`scripts/vercel-install.sh`) runs
  `scripts/vercel-promotion-guard.mjs` before installing dependencies. It fails
  the build when an open PR targets `main` from a branch other than `staging`,
  so the promotion rule is enforced even while GitHub Actions is unavailable.

While GitHub Actions is unavailable (for example, an account billing lock),
branch protection requires only the `Vercel` check. Once Actions is healthy,
restore the three job checks on both branches and the `Promotion guard` check on
`main`.

The `staging` and `main` branches require a pull request, the required status
checks, and an up-to-date branch before merging. Force pushes and branch
deletion are blocked.
