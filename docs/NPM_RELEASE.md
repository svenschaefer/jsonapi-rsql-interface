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
5. commit release files with explicit paths (no `git add -A`)
6. tag and push
7. publish and verify registry propagation
