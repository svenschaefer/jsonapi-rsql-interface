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
5. provision/update external smoke harness package for the target version:
   - default source:
     - `npm run smoke:external:prepare -- --version <x.y.z> --phase all --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test`
   - explicit source override (private/unpublished harness):
     - `npm run smoke:external:prepare -- --version <x.y.z> --phase all --harness-install-spec "<npm|git|tarball|path spec>" --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test"`
   - harness directory contract:
     - `<harness-dir>/<timestamp>-<phase>-<version>`
6. run external **pre-publish** smoke harness for the target version:
   - harness baseline path: `C:\code\jsonapi-rsql-interface-smoke-test`
   - resolution rule: if root path has no `package.json`, run from installed harness package under `<harness-dir>/<timestamp>-<phase>-<version>/node_modules`
   - command:
     - `npm run smoke:external -- --phase pre --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface`
   - optional deterministic run id:
     - pass `--timestamp <YYYYMMDDTHHMMSSZ>` to pin the scoped harness directory name
   - one-shot local pre-publish flow (pack + bootstrap + pre smoke):
     - `npm run smoke:external:prepublish -- --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface`
7. commit release files with explicit paths (no `git add -A`)
8. tag and push
9. publish and verify registry propagation
10. run external **post-publish** smoke harness for the same version:
   - `npm run smoke:external -- --phase post --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface`
11. record pre/post smoke outcomes in `docs/RELEASE_EVIDENCE.md`

## Workspace Adapter Release (`@jsonapi-rsql/pg`)

Use this checklist for first and subsequent adapter package releases.

1. set adapter package version in `packages/adapter-pg/package.json`
2. ensure adapter publish contract is ready:
   - `"private": false`
   - package metadata present (`name`, `version`, `license`, `engines`, `peerDependencies`)
3. run full repo gates:
   - `npm run ci:check`
   - `npm run audit:runtime`
4. validate adapter package artifact:
   - `npm pack --workspace packages/adapter-pg --dry-run`
5. run external pre-publish smoke for adapter artifact:
   - `npm run smoke:external:prepublish -- --version <x.y.z> --workspace packages/adapter-pg --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name @jsonapi-rsql/pg`
6. publish adapter package:
   - `npm publish --workspace packages/adapter-pg --access public`
7. verify registry package metadata:
   - `npm view @jsonapi-rsql/pg@<x.y.z> version peerDependencies engines`
8. run external post-publish smoke for adapter package:
   - `npm run smoke:external -- --phase post --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name @jsonapi-rsql/pg`
9. record adapter release evidence in `docs/RELEASE_EVIDENCE.md`
