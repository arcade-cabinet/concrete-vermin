---
title: Deployment
updated: 2026-04-28
status: current
domain: ops
---

# Deployment

## Environments

| Env | Where | Trigger | What |
|---|---|---|---|
| Web preview | GitHub Pages (`arcade-cabinet.github.io/concrete-vermin`) | push:main | `cd.yml` → builds + deploys |
| Web release | GitHub Release tarball | release-please tag | `release.yml` |
| Android debug | (deferred to v2 — no longer in `ci.yml`) | — | future |
| Android release | GitHub Release APK | release-please tag | `release.yml` android job |
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

## Required GitHub secrets

The release pipeline needs three classes of secret in the repository's GitHub Actions settings.

### `CI_GITHUB_TOKEN` (release-please bot)

A fine-grained personal access token used by `release.yml`'s `release-please-action` step in place of the default `GITHUB_TOKEN`. Required because release-please opens PRs and pushes tags — the default token can't trigger downstream workflows (the "GitHub Actions tokens cannot trigger other workflows" rule), which would mean release tags don't fire `cd.yml` or the android job.

**Scope (fine-grained PAT):**

- Repository access: this repo only.
- Repository permissions:
  - **Contents:** Read and write (push tags, write CHANGELOG)
  - **Pull requests:** Read and write (open release PRs)
  - **Workflows:** Read and write (release-please touches `.github/workflows/` versions on bumps)
- No organization permissions required.

The token must NOT have the broad classic-PAT `repo` scope — fine-grained is mandatory so a leak is bounded to this repo.

### Android signing secrets (for `release.yml` android job)

To produce a signed AAB / APK in CI rather than relying on a manual local sign:

| Secret | What it is |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | The keystore file (`release.keystore`) base64-encoded. Decoded into the runner before the Gradle build. |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password. |
| `ANDROID_KEY_ALIAS` | The signing key alias inside the keystore. |
| `ANDROID_KEY_PASSWORD` | Password for the alias (often the same as the keystore password). |

The `release.yml` android job decodes `ANDROID_KEYSTORE_BASE64` to `android/app/release.keystore`, writes a `keystore.properties` file referencing the other three secrets, then runs `./gradlew bundleRelease`. The signed `.aab` is uploaded to the GitHub Release attached to the release-please tag.

**Generating the keystore (one-time, locally):**

```bash
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias concrete-vermin \
  -keyalg RSA -keysize 2048 -validity 36500
base64 < release.keystore | pbcopy   # paste into ANDROID_KEYSTORE_BASE64
```

Keep the local `release.keystore` in a password manager (NOT in the repo, NOT in `~/Library/Keychains`). Losing it means the next signed release cannot match the previous app on Play Store — every install will be flagged as a "different app."

### Cloudflare / Pages secrets

Currently none. GitHub Pages deploys via `actions/deploy-pages@v4` using the workflow's built-in token; no separate secret needed.

## Verifying the release pipeline end-to-end

A dry run of the full path looks like:

1. Land a feature PR; merge. Confirm `cd.yml` deploys to Pages (HTTP 200 on the new bundle hash).
2. Wait for release-please to open its bump PR (usually within 5 minutes of the feature merge). Verify it carries the right bump (feat → minor, fix → patch).
3. Merge the release-please PR. Confirm:
   - A new `vX.Y.Z` tag appears.
   - `release.yml` fires (use `gh run list --workflow=release.yml --limit 3`).
   - The `android` job inside `release.yml` succeeds and the GitHub Release page shows a signed `.aab` attached.
4. Smoke-test the AAB: `bundletool build-apks` → install on a real device → launch.

If step 3's android job fails on signing, the most likely cause is a base64 secret with embedded line breaks (some clipboards add them). Re-base64 with `base64 -w 0` on Linux or `base64 | tr -d '\n'` on macOS.

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
