# Operational Guide

## Commands

- `compile`: compile JSON:API query input to a deterministic plan/error envelope.
- `validate-plan`: validate plan envelope shape.

## CLI Examples

```bash
npx jsonapi-rsql-interface compile --query "filter=status==active&sort=-created"
npx jsonapi-rsql-interface compile --in ./test/fixtures/compile-input.json --out ./artifacts/plan.json
npx jsonapi-rsql-interface validate-plan --in ./test/fixtures/example-plan.json
```

## Quality Gates

- `npm test`
- `npm run pack:check`
- `npm run smoke:release`
- `npm run ci:check`
