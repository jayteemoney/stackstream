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
   npm test
   cd frontend && npx tsc --noEmit && npm run lint && npm run build
   cd ../openclaw-service && npx tsc --noEmit
   ```

3. Push the branch and open a pull request **targeting `staging`**:

   ```bash
   git push -u origin feat/my-change
   gh pr create --base staging --fill
   ```

4. Get CI green and one approving review, then merge into `staging`.

5. Verify the change on the staging deployment (or locally from `staging`).

## Promoting to production

Once `staging` is verified and fit for release:

1. Open a promotion pull request from `staging` into `main`:

   ```bash
   gh pr create --base main --head staging --title "Promote staging to production" --fill
   ```

2. The `Promotion guard` check rejects any PR into `main` whose source branch is
   not `staging`.

3. Get CI green and one approving review, then merge. `main` deploys to production.

## Hotfixes

Hotfixes follow the same path: branch off `staging`, open a PR into `staging`,
verify, then promote `staging` to `main`. If production is broken and an
expedited release is unavoidable, an administrator may temporarily relax branch
protection, but the fix must still be merged back into `staging` afterwards.

## CI

`.github/workflows/test.yml` runs on every pull request and on pushes to
`staging` and `main`:

- Contract and unit tests (`npm test`)
- Frontend typecheck, lint, and production build
- OpenClaw service typecheck

The `staging` and `main` branches require a pull request, green CI, one
approving review, and an up-to-date branch before merging. Force pushes and
branch deletion are blocked.
