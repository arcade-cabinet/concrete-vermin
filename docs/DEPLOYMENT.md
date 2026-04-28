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
2. Wait for release-please to open its bump PR (usually within 5 minutes of the feature merge). Verify it carries the right bump (feat → minor, fix → patch). The `automerge.yml` workflow auto-approves and enables auto-merge for any PR whose head branch starts with `release-please--` and whose head repo is this repo (the prefix-spoof guard).
3. The release-please PR auto-merges when CI is green. Confirm:
   - A new `vX.Y.Z` tag appears (`gh release list --limit 3`).
   - `release.yml` fires twice — once for the release-please-PR-merge push (release_created=false → android job skips), then again for the tag-creating push (release_created=true → android job runs).
   - The `android` job inside `release.yml` succeeds — even without signing secrets, it builds a debug AAB and uploads it as a workflow artifact.
   - **With** signing secrets configured: the GitHub Release page shows a signed `.aab` attached as `concrete-vermin-vX.Y.Z.aab`.
4. Smoke-test the AAB: `bundletool build-apks` → install on a real device → launch.

### Verified end-to-end as of 2026-04-28

- Release-please cycles trigger on every merge to `main`. Cadence observed: 19 minor bumps in ~2 days.
- Auto-merge fires correctly on release-please PRs; auto-approval is granted by the `automerge.yml` job whose `if:` condition matches `startsWith(github.event.pull_request.head.ref, 'release-please--')`.
- The `android` job runs on every release-created run and successfully builds an unsigned debug AAB. Workflow-artifact upload to the Actions tab works end-to-end.
- **Open**: signed AAB attachment to the GitHub Release page is gated on `secrets.ANDROID_KEYSTORE_BASE64` being set. Steps to seed are documented above; once set, the next release-please bump will produce a signed `.aab` on the Release page.

### Common failure modes

- **android job fails on signing.** Most likely cause is a base64 secret with embedded line breaks (some clipboards add them). Re-base64 with `base64 -w 0` on Linux or `base64 | tr -d '\n'` on macOS.
- **release-please PR doesn't auto-merge.** Check that all required CI jobs are green (`balance-benchmark` is `continue-on-error`; only `core` is currently a hard required gate). If `automerge.yml`'s "Approve PR" step shows "Resource not accessible by integration", the `CI_GITHUB_TOKEN` PAT lacks the `pull_requests: write` permission.
- **android job is skipped silently.** Means `release-please.outputs.release_created` was false — the run was triggered by a non-tag-creating push (e.g. the merge of the release-please PR itself, before the tag is pushed). The next push (the tag) will re-trigger and the android job will run.

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
