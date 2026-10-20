# Regression and gotcha register

Quality trial started 2026-10-20. Review friction around 2026-11-20. Pass counters below record new, independently evidenced runs only, not historical results.

## Regressions

- [2026-10-19] Google disconnect previously conflated local cleanup with confirmed account revocation -> check: `npm test -- src/test/disconnect.test.ts` and `npx playwright test e2e/disconnect.spec.ts`; cover Library, Settings and Delete-all-data with successful, failed, hung, missing, expired, near-expiry and blocked-script states | consecutive passes: 0/5 recorded here. Source: merged PR #39; this docs change does not claim to rerun it.
- [2026-10-19] Local-library tests hard-coded a different origin from Playwright's baseURL -> check: `npx playwright test e2e/local-library.spec.ts` using the repository config; inspect same-origin network assertions and the `baseURL` fixture | consecutive passes: 0/5 recorded here. Source: merged PR #41, correction f9c0dcd.
- [2026-10-19] Local reader needed file-input overflow protection, explicit keyboard boundaries and render-completion evidence -> check: `npx playwright test e2e/local-library.spec.ts`; inspect screenshots, rendered-key readiness, nonblank pixels, Escape/focus return, and local-file network/storage isolation | consecutive passes: 0/5 recorded here. Source: `src/library/PdfReader.tsx`, `src/style.css`, `e2e/local-library.spec.ts`, PR #41.

Five recorded consecutive passes make a check eligible for automation; adding CI is a separate code change. Record revision, environment and evidence before increasing a count. No automatic edits or release approval follow from a counter.

## Gotchas

- [2026-10-20] Local token/selection removal does not prove Google revoked account access. Mocked tests do not certify a real account grant | source: `src/drive/disconnect.ts`, `src/drive/google.ts`, `e2e/disconnect.spec.ts` | version: main 64dc985 | validity: recheck after OAuth changes | projects: Pilares.
- [2026-10-20] A device PDF stays in page memory; catalogue PDFs are public site assets, not a private collection. The optional Drive picker is a separate path | source: `src/library/LocalLibrary.tsx`, `src/library/PdfReader.tsx`, `src/pages/Privacidade.tsx` | version: main 64dc985 | validity: recheck after storage/network changes | projects: Pilares.
- [2026-10-20] PDF.js canvas/text extraction is not a full tagged-PDF or OCR implementation. Check password failure, inert scripts, corrupt/oversize files and no unintended network requests | source: `LIBRARY-TEST-REVIEW.md`, `e2e/local-library.spec.ts` | version: main 64dc985 | validity: rerun after parser/dependency changes | projects: Pilares.
- [2026-10-20] Storage durability requires immediate-save, recovery and cross-tab checks. Do not substitute a green build for save correctness | source: `e2e/immediate-save.spec.ts`, `e2e/recovery.spec.ts`, `e2e/cross-tab-save.spec.ts`, `src/test/store-recovery.test.ts` | version: main 64dc985 | validity: rerun after storage changes | projects: Pilares.
- [2026-10-20] Historical first-Tab skip-link failures were reported during the library review. Reproduce against the unchanged base before calling a current failure unrelated; do not suppress it silently | source: `LIBRARY-TEST-REVIEW.md`, `e2e/accessibility.spec.ts` | version: main 64dc985 | validity: not a permanent waiver; reassess each run | projects: Pilares.

## Check entry points

`npm run typecheck`, `npm run build`, `npm test`, `npm run lint`, `npm run test:e2e`. Inspect `playwright.config.ts` for baseURL, browser installation and webServer behavior. Full e2e may differ from a focused spec; report exactly what ran.

Controller/contact/retention review before external tester recruitment remains separate from feature QA. Never claim a GDPR audit based on these checks. If a gotcha is independently observed in a second project, propose a shared rule with both sources.

