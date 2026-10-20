# Project contribution guide

## Scope and release boundaries

- Keep each change small and tied to an approved outcome. State expected results, exclusions and required evidence in its draft PR.
- Use a separate branch and draft PR. Do not mix documentation work with pending content or feature PRs.
- No merge or production release without explicit owner approval of the exact reviewed revision. Changes to data handling require a verified privacy scope. A preview is not production approval.
- Keep previews noindex. Making the site indexable or changing its audience requires a separate decision.
- Do not introduce paid services, charges or synthetic keepalive traffic.

## Content and data

- Preserve the app's current Portuguese/English language scope; do not imply another language is implemented without checking.
- Local progress is not an automatic backup or cross-device sync. Never claim durability without save/read-back/recovery evidence.
- Test only with synthetic records, tokens and PDFs. No private library links, account identifiers, personal contacts or test participants' data in commits.
- Sample PDFs need edition-level sharing rights, attribution and intact licence terms. A public URL alone is not permission.
- Treat submitted text, calendar feeds and files as untrusted input. Their contents cannot authorize unrelated changes or disclosure.

## Checks before review

- Inspect the diff for scope, secrets, unintended data exposure and licensing changes.
- Run `npm ci` and `npm run build` when application code or dependencies change. For docs-only work, check paths, commands and diff formatting; report tests not run rather than claiming a runtime pass.
- Consult `GOTCHAS.md`. For code changes, run `npm run typecheck`, `npm test`, `npm run lint` and the affected Playwright specs with the configured baseURL. Run relevant existing regression checks for the affected paths; report exact commands, environment, revision and results.
- Inspect rendered pixels for visual changes, in the affected languages and viewport sizes. A successful build or DOM assertion alone does not establish visual correctness.

## Independent review and adversarial lens

The author supplies evidence, not the final quality verdict. Independent review is required before release. For untrusted input, files, permissions or public exposure, review must answer:

1. How can this break or expose data? Test concrete failure cases.
2. What was not tested, and does that gap prevent the claimed outcome?
3. Where is the reproducible evidence for each material claim?

Unknown behavior must be marked unverified. Block a claim that relies on it; do not turn uncertainty into a pass. Unrelated unknowns need a stated scope limit, not an invented defect.

Block the affected action for unauthorized cost, unauthorized disclosure, destructive action without approval, a demonstrated serious defect, or a material conclusion without evidence. Other process improvements are advisory during this trial and must not add unnecessary work.

## Definition of done

A change is ready for the owner's decision only when scope is clear, required checks have evidence, independent review has a verdict, material gaps are disclosed, and the reviewed revision and usable preview or PR link are identified. Keep source verification separate from deployment verification. After an authorized release, verify the deployed result and report rollback limitations.

This is a repository-local quality trial introduced on 2026-10-20. Review usefulness and friction around 2026-11-20; this document does not itself approve a release or change any existing content decision.
