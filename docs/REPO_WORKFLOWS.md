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
5. Run external pre-publish smoke harness for target version:
   - `npm run smoke:external -- --phase pre --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --package-name jsonapi-rsql-interface`
6. Commit release files on a release branch.
7. Merge to `main`.
8. Create annotated tag on `main`: `git tag -a v<x.y.z> -m "v<x.y.z>"`.
9. Push commit and tag.
10. Publish to npm: `npm publish --access public`.
11. Verify npm propagation.
12. Run external post-publish smoke harness:
   - `npm run smoke:external -- --phase post --version <x.y.z> --harness-dir "C:\code\jsonapi-rsql-interface-smoke-test" --package-name jsonapi-rsql-interface`
13. Record both smoke outcomes in release evidence.

Rules:

- Never rewrite history after tagging.
- Never amend a tagged release commit.
- If a release is wrong, ship a new patch release.
