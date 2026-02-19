# npm Release Process

## Two Release Streams

1. Git stream
- Release commit on `main`
- Annotated tag `vX.Y.Z`

2. npm stream
- Publish package to npmjs
- Verify registry propagation
- Verify installed package behavior in a clean workspace

Both streams should point to the same version and release commit.

## Release Checklist

1. `npm run release:check`
2. update `CHANGELOG.md`
3. `npm version <x.y.z> --no-git-tag-version`
4. `npm run ci:check`
5. run external **pre-publish** smoke harness for the target version:
   - harness baseline path: `C:\code\jsonapi-rsql-interface-smoke-test`
   - resolution rule: if root path has no `package.json`, run from installed harness package under `node_modules`
   - command:
     - `npm run smoke:external -- --phase pre --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface`
6. commit release files with explicit paths (no `git add -A`)
7. tag and push
8. publish and verify registry propagation
9. run external **post-publish** smoke harness for the same version:
   - `npm run smoke:external -- --phase post --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface`
10. record pre/post smoke outcomes in `docs/RELEASE_EVIDENCE.md`
