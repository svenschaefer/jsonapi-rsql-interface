# Contributing

## Requirements

- Node.js `>=20`
- npm

## Setup

```bash
npm ci
```

## Validate Before PR

```bash
npm run ci:check
```

## Pull Requests

- Keep changes scoped and reviewable.
- Add or update tests for behavior changes.
- Update docs when contracts or usage change.
- Preserve backward compatibility for public API unless coordinated for a major release.
- Treat semantic expansions (operators/types/include behavior/limits) as security-relevant changes.
