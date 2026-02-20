# Repo Workflows

## Standard Flow

1. Implement feature.
2. Add/adjust tests.
3. Run `npm test`.
4. Update docs if behavior changed.
5. Commit with a clear message.

## Release Flow

1. Start from a clean worktree and run: `npm run release:check`.
2. Update `CHANGELOG.md`.
3. Bump version (no tag yet): `npm version <x.y.z> --no-git-tag-version`.
4. Re-run gates: `npm run ci:check`.
5. Provision/update external smoke harness package for target version:
   - `npm run smoke:external:prepare -- --version <x.y.z> --phase all --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test`
   - if harness is private/unpublished, use explicit install spec:
     - `npm run smoke:external:prepare -- --version <x.y.z> --phase all --harness-install-spec "<npm|git|tarball|path spec>" --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test"`
   - scoped harness directory shape: `<timestamp>-<phase>-<version>`
6. Run external pre-publish smoke harness for target version:
   - `npm run smoke:external -- --phase pre --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface`
   - if harness root has no `package.json`, the runner resolves installed harness package under `<harness-dir>/<timestamp>-<phase>-<version>/node_modules`
   - optional: pass `--timestamp <YYYYMMDDTHHMMSSZ>` to pin a specific scoped run directory
   - optional one-shot command:
     - `npm run smoke:external:prepublish -- --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface`
7. Commit release files on a release branch.
8. Merge to `main`.
9. Create annotated tag on `main`: `git tag -a v<x.y.z> -m "v<x.y.z>"`.
10. Push commit and tag.
11. Publish to npm: `npm publish --access public`.
12. Verify npm propagation.
13. Run external post-publish smoke harness:
   - `npm run smoke:external -- --phase post --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface`
14. Record both smoke outcomes in release evidence.

## Workspace Adapter Release Flow (`jsonapi-rsql-interface-pg`)

1. Set adapter version in `packages/adapter-pg/package.json`.
2. Run quality gates:
   - `npm run ci:check`
   - `npm run audit:runtime`
3. Validate pack artifact:
   - `npm pack --workspace packages/adapter-pg --dry-run`
4. Run external pre-publish smoke for adapter artifact:
   - `npm run smoke:external:prepublish -- --version <x.y.z> --workspace packages/adapter-pg --harness-dir "C:\code\jsonapi-rsql-interface-pg-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface-pg`
5. Publish adapter:
   - `npm publish --workspace packages/adapter-pg --access public`
6. Verify registry metadata:
   - `npm view jsonapi-rsql-interface-pg@<x.y.z> version peerDependencies engines`
7. Run external post-publish smoke for adapter:
   - `npm run smoke:external -- --phase post --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-pg-smoke-test" --harness-package jsonapi-rsql-interface-smoke-test --package-name jsonapi-rsql-interface-pg`
8. Record evidence in `docs/RELEASE_EVIDENCE.md`.

Rules:

- Never rewrite history after tagging.
- Never amend a tagged release commit.
- If a release is wrong, ship a new patch release.

