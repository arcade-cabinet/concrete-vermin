---
title: Deployment
updated: 2026-04-27
status: current
domain: ops
---

# Deployment

## Environments

| Env | Where | Trigger | What |
|---|---|---|---|
| Web preview | GitHub Pages (`<org>.github.io/concrete-vermin`) | push:main | `cd.yml` → builds + deploys |
| Web release | GitHub Release tarball | release-please tag | `release.yml` |
| Android debug | GitHub Actions artifact | every PR | `ci.yml` → `android-debug-apk` job |
| Android release | GitHub Release APK | release-please tag | `release.yml` |
| iOS | not yet | — | future |

## Release process

1. Land features via PRs (CI must be green; never `--admin` merge).
2. release-please opens a PR with the next-version bump + CHANGELOG.
3. Reviewer merges the release-please PR.
4. release-please creates a tag `vX.Y.Z`.
5. `release.yml` triggers:
   - `pnpm test:release` (RELEASE_GATING=1) — balance lock + benchmark gates
   - `pnpm build` → web bundle
   - `pnpm cap sync android && ./gradlew assembleRelease` → unsigned release APK
   - Both attached to the GitHub Release

## Android signing

The release APK out of CI is **unsigned**. To ship to Play Store:

1. Generate a signing key locally (`keytool -genkeypair ...`).
2. Store as `android/app/release.keystore` (gitignored).
3. Add `android/keystore.properties` (gitignored) with `storeFile`, `storePassword`, `keyAlias`, `keyPassword`.
4. Modify `android/app/build.gradle` `signingConfigs` to reference the properties.
5. Sign via Android Studio or `./gradlew bundleRelease`.

(In v1, signing is manual outside CI. Automated signing is a follow-up.)

## Mobile QA checklist

Before tagging a release, manual pass on a real Android device:

- [ ] All 12 missions playable end-to-end
- [ ] Touch latency feels acceptable (drag-to-aim doesn't lag)
- [ ] Haptics fire correctly (off / light / medium / heavy)
- [ ] Orientation lock works (cannot rotate to portrait)
- [ ] Background → foreground correctly pauses + resumes
- [ ] Audio resumes correctly after notification interruption
- [ ] App icon + splash screen present
- [ ] Sustained 60fps on low-end test device
- [ ] No crashes after 30-min play session
- [ ] Persistence survives app restart (high scores, artifacts, bestiary, loadouts)
