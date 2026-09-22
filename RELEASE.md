# n8n release procedure

## Before the first release

1. Confirm `n8n-nodes-loopgrid` is still available on npm.
2. Run `npm install` once locally and commit the generated `package-lock.json`.
3. Run `npm run lint`, `npm run build`, and `npm pack --dry-run`.
4. Run `npm run dev` and test all six operations against a real LoopGrid test workspace.
5. Push the source to `loopgridio/loopgrid-n8n` and confirm GitHub CI passes.
6. Publish `0.1.0` from GitHub Actions with provenance. If Trusted Publishing cannot be configured before the package exists, use a narrowly-scoped `NPM_TOKEN` for this initial workflow run only.
7. Confirm the npm package page shows provenance.
8. Run `npx @n8n/scan-community-package n8n-nodes-loopgrid@0.1.0` against the published artifact.
9. Fresh-install `n8n-nodes-loopgrid@0.1.0` on a clean self-hosted n8n instance and rerun the lifecycle.
10. Configure npm Trusted Publishing for `loopgridio/loopgrid-n8n` + `publish.yml`, then remove the publish token.
11. Submit the package in the n8n Creator Portal for verified community node review.
12. Only after verification, advertise direct n8n Cloud availability.
