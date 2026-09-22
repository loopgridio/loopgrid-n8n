LoopGrid n8n lint fix

Copy/overwrite these paths inside your existing pkg folder:
  credentials/LoopGridApi.credentials.ts
  credentials/loopgrid.svg
  nodes/LoopGrid/LoopGrid.node.ts
  nodes/LoopGrid/loopgrid.dark.svg

Keep your existing node_modules and package-lock.json.
Then run:
  npm run lint
  npm run build
