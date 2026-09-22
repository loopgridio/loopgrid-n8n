# n8n-nodes-loopgrid

LoopGrid community node for recording and verifying signed, tamper-evident evidence around consequential AI-agent decisions.

> Design-partner integration. Verification confirms integrity of captured evidence; it does not determine correctness or legal compliance.

## Operations

- Record Decision
- Record Action
- Record Outcome
- Submit Review
- Get Decision
- Verify Decision

LoopGrid records evidence only. **It never executes your external business action.** Put the normal n8n action node (Stripe, CRM, database, etc.) between `Record Decision` and `Record Action`.

## Credentials

Create a LoopGrid service key and configure:

- Base URL — for example `https://your-loopgrid.example.com`
- Workspace ID
- API Key

For all six operations in one credential, the key needs `ingest`, `read`, and `review`. Prefer smaller scopes when a workflow only uses a subset.

## Example pattern

```text
AI/Rules node
  -> LoopGrid: Record Decision
  -> Human approval / policy step (when applicable)
  -> Your external action node
  -> LoopGrid: Record Action
  -> Observe downstream result
  -> LoopGrid: Record Outcome
  -> LoopGrid: Verify Decision
```

Default privacy mode for Record Decision is `redacted`. Only map data you intend LoopGrid to capture.

## Output

Each item is passed through and the LoopGrid API response is added under `loopgrid`.

If **Continue On Fail** is enabled, request failures are returned under `loopgrid_error` instead of stopping the workflow.

## Installation

### Local development

Requires a current Node.js version supported by the n8n node tooling.

```powershell
npm install
npm run lint
npm run build
npm run dev
```

`npm run dev` starts a local n8n development instance with the LoopGrid node loaded.

### Self-hosted n8n after npm publication

Install `n8n-nodes-loopgrid` from **Settings -> Community Nodes**, then create a LoopGrid credential.

n8n Cloud installation should only be advertised after n8n verifies the community node.

## Pre-publish checks

```powershell
npm ci
npm run lint
npm run build
npm pack --dry-run
```

After the exact version is published to npm, run n8n's official scanner against the published package:

```powershell
npx @n8n/scan-community-package n8n-nodes-loopgrid@0.1.0
```

## Publishing

The included `publish.yml` publishes releases through GitHub Actions so npm provenance can be attached.

For the first npm release, if the package does not yet exist and npm Trusted Publishing cannot yet be configured, use a narrowly-scoped npm publishing token as the `NPM_TOKEN` GitHub Actions secret. After the first release exists, configure npm Trusted Publishing for:

- Owner: `loopgridio`
- Repository: `loopgrid-n8n`
- Workflow: `publish.yml`

Then remove the long-lived publish secret.

## Security

The credential stores the LoopGrid API key as a password field and sends it in the `X-LoopGrid-Key` header. The node calls only LoopGrid API paths under the configured Base URL.

Do not put secrets or unrelated customer data into evidence fields. Use the least-privilege LoopGrid scopes required by the workflow.

## Independent verification

The node's `Verify Decision` operation asks the connected LoopGrid service to verify the decision. For independent/offline verification of an exported evidence bundle, use `loopgrid-verify`.

## Support

- Issues: https://github.com/loopgridio/loopgrid-n8n/issues
- Contact: hello@loopgrid.io
- LoopGrid core: https://github.com/cybertechsoft/loopgrid

## License

MIT. The LoopGrid core is distributed separately under its own license.
