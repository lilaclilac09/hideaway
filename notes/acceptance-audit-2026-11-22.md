# Acceptance audit — 2026-11-22

## Scope

Standard: ACCEPTANCE.md §§1–8, root AGENTS.md / CLAUDE.md / `.cursor/rules/acceptance.mdc`, README instructions. Inspected frontend upload/storage services, SDK, program access-control scaffolding, implementation claims, full history, all PRs, GitHub deployment metadata and available developer tools. No additional privacy/product criteria invented: unsupported claims are evaluated under verification, Demo ≠ product and repository instructions. No secrets used, written or reported.

## Failing items

| Acceptance / source rule | Finding and evidence | Resolution |
|---|---|---|
| §5 — `AGENTS.md`, `ship-visible-mvp.mdc` | README lacked explicit product status and next action. GitHub homepage null, Pages disabled/API 404, deployments `[]`. | Fixed here: BLOCKED plus choose supported Lit integration and validate encryption/deployment. Unlisted external deployment not ruled out. |
| §2/§5/§6 — verification, Demo ≠ product, README | README and IMPLEMENTATION_COMPLETE claimed private/encrypted and complete behavior, but upload service passes original file bytes to IPFS, normal UI call omits time-lock argument and falls through to plaintext CID. | Documentation corrected/qualified. Isolated service test with mocked IPFS node confirms bytes forwarded unchanged; no real file uploaded. Not an encryption implementation or privacy certification. |
| §2/§5/§6 — verification, README | Bonsol/Arcium/Lit and time-lock claims exceed code: auth signature placeholder, verification TODOs and `current_timestamp = 0i64`; SDK program ID is placeholder. | Documentation scoped as incomplete scaffolding. Not fixable as a minimal audit patch without intended integrations/deployment and verification. No speculative security implementation. |
| §2/§3/§6 — debug-repro, README setup | Frontend dependency installation exits 1: `No matching version found for lit-js-sdk@^3.1.0`. | Disclosed; not silently replaced with older/different SDK. Choosing supported API/version needs integration compatibility decision. |
| §4 — `ui-step-screenshot.mdc` | Existing UI lacks current 390×844 stills and successful interaction walkthrough; dependencies cannot install. | Not fixable here without dependency repair. UI could not be rendered, so no product PNG/WebP is supplied or fabricated. Existing UI privacy labels remain unverified and are not certified by this docs patch. |
| §2/§5/§7 — verification, production proof, blockers | Solana build/validator toolchain absent; no deployment, wallet or live integration proof. | Disclosed as blocked; no chain transactions, public data uploads or localhost-as-production claim. |

## Reproduction and root causes

Frontend setup failed before app startup. Checked npm environment once: no repo blueprint, registry host is `registry.npmjs.org`, `npm view lit-js-sdk version --json` reports `1.1.250`, while declared range is `^3.1.0`. The package-resolution error, not a guessed UI or wallet bug, is the demonstrated setup blocker. Peer-resolution warnings also occur during failed install; changing peer ranges would not supply the missing requested package version.

Solana environment check: Cargo/Rust exist, but `solana` and `cargo-build-sbf` are not installed; `cargo build-sbf --version` exits 101 with `no such command: build-sbf`. No safe installed SBF equivalent exists here; native hashing tests do not replace program/deployment testing. No toolchain or dependency-version bypass installed.

For encryption scope, considered whether file encryption might happen before `uploadToIpfs`. Source chain: `FileUpload.uploadFiles` passes the selected File into `services/hideaway.uploadFile` without time-lock option; that function hashes it and calls `uploadToIpfs(file)` directly; IPFS service takes `file.arrayBuffer()` then `node.add(fileBuffer)`. Separate Lit branch encrypts CID only when timeLockExpiry is supplied. An isolated transpilation test substitutes only the IPFS node, invokes the actual IPFS upload service, and asserts the exact original ArrayBuffer reaches `node.add`. This disproves encryption inside that service, not deployment reachability: browser/wallet path could not execute here because installation is blocked. No actual sensitive-file exposure or live transaction is claimed.

Minimal patch: status/scope and privacy warnings in README, qualify feature/security assertions, relabel historical implementation inventory. Preserve all code and flows. No changes to shared config, dependency ranges, encryption, authorization, program IDs or wallet logic.

## Passing items / applicability

- §1: inspect → plan → minimal docs patch → checks. No new dependency, redesign or deleted working flow.
- §2: SDK build and hashing utilities checked; isolated IPFS/source-scope checks distinguish local behavior from live/private-storage evidence.
- §3: actual dependency failure and missing-tool error captured; no speculative frontend repair.
- §4: UI evidence explicitly incomplete, not represented by docs screenshots or a simulated app.
- §5: sole PR #1 MERGED, merge SHA `5ba7d301ad230eb145fb04de162931deffdd06e2`; after fetch, `git merge-base --is-ancestor <sha> origin/main` exits 0. UI originated in direct initial commit. No prior UI PR screenshot artifact to certify; historical process cannot be reconstructed as observed verification. Task requests push only, no PR/merge/deploy.
- §6: root rule files delegate to ACCEPTANCE. README client and hashing commands run where available; unavailable frontend/SBF paths disclosed.
- §7: blockers below; no credentials requested or used, no risky live files uploaded.
- §8: PR #1 and audit-note closer pass existing checker; no historical PR bodies fail.

## Checks and observed output

Frontend (`frontend/`):

```text
npm install --no-package-lock
npm error code ETARGET
npm error notarget No matching version found for lit-js-sdk@^3.1.0.
exit: 1
```

No frontend build, dev-server/browser render or interaction test ran after failed install. No lint/test script exists in frontend or client package.json.

Client (`client/`), after installing only existing dependencies:

```text
npm run build
> @hideaway/client@0.1.0 build
> tsc
exit: 0
```

Root:

```text
cargo test -p hideaway-scripts --locked
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
cargo test exit: 0

CARGO_TARGET_DIR=/home/ubuntu/audit-artifacts/hideaway/rust-target cargo run -p hideaway-scripts --bin test_hideaway --locked
All tests passed! ✓
rust hashing exit: 0

python scripts/test_hideaway.py
All tests passed! ✓
python hashing exit: 0

node /home/ubuntu/audit-artifacts/hideaway/check-scope.cjs
PASS: isolated IPFS service passes original file bytes unchanged to mocked node.add (no network or real upload)
PASS: documented default CID/time-lock limitations and qualified status/inventory match current source
NOT VERIFIED: browser UI, wallet transactions, deployed program, privacy enforcement or external integrations

gh api repos/lilaclilac09/hideaway/pulls/1 --jq .body | python scripts/check_acceptance.py
ACCEPTANCE.md: evidence closer complete
```

Audit-note validation: `python scripts/check_acceptance.py notes/acceptance-audit-2026-11-22.md`. Whitespace: `git diff --check`, no diagnostics. No code/test changes requiring new functional cases. Tests cover existing hash consistency, salt uniqueness, size and verification behavior; they do not test vault authorization or encryption.

Generated SDK files/dependencies and Rust output moved to external artifacts. Because `target/` was already tracked, its generated cache changes were preserved externally and original tracked build-cache files reconstructed from HEAD; no cache diff included. No source changes discarded.

Artifacts under `/home/ubuntu/audit-artifacts/hideaway/` (not committed):

- `frontend-install.log`, `client-install.log`
- `rust-tests.log`, `rust-hashing.log`, `python-hashing.log`
- `scope-check.log`, `check-scope.cjs`
- `client-dist/` — successful SDK build output
- `rust-target/` — local Rust build output

No 390×844 PNG/WebP: UI unrenderable due dependency blocker. No chain program build, validator, funded wallet, on-chain transaction, Lit/IPFS network operation or production acceptance verified.

## Blockers

| blocked_on | evidence | impact | human_action | not_doing |
|---|---|---|---|---|
| Supported Lit dependency/API choice | npm ETARGET for declared ^3.1.0 on public registry. | blocked: frontend/UI evidence | Choose supported Lit integration and authorize API-compatible repair. | No silent downgrade, new SDK or fake provider. |
| Actual privacy/access integration | Raw byte forwarding in isolated service test; default plaintext CID path; placeholder auth/program ID/time clock and TODO verification. | blocked: private-vault acceptance | Define/complete intended encryption and authorization integration, then verify with non-sensitive fixtures. | No claim that hashes, CIDs or model diagrams enforce privacy. |
| Solana toolchain/deployment | No build-sbf or solana installed; no deployment evidence identified. | blocked: program/live checks | Provide intended toolchain/deployed program and authorized test setup. | No public upload, funds or deployment change. |

Status: BLOCKED — next human action: choose supported Lit integration and validate encryption/deployment before using files.

```txt
root cause: frontend requests unavailable Lit SDK version; README and completion inventory overstate privacy/integration readiness; status omitted.
files changed: README.md; IMPLEMENTATION_COMPLETE.md; notes/acceptance-audit-2026-11-22.md.
checks run: client TypeScript build passes; three Rust unit tests pass; Rust/Python hashing suites pass; isolated IPFS scope check passes; frontend install fails ETARGET; historical PR and audit closers pass; whitespace check clean.
manual QA: source-to-service privacy scope checked with mocked IPFS node; UI could not render, so mobile stills and walkthrough unavailable.
verification: logs, SDK build output and scope checker at /home/ubuntu/audit-artifacts/hideaway/; no live wallet, chain, external storage or production proof.
remaining risks: unavailable frontend dependency; unencrypted file-upload implementation; placeholder access integrations/program ID; no Solana build tools or successful UI evidence.
manual steps: choose supported Lit integration, complete and validate intended privacy/deployment setup, then capture genuine mobile functional evidence using non-sensitive fixtures.
safe to merge: yes
```
