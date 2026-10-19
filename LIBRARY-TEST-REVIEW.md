# Local reader and licensed test catalogue

Review scope only. No merge, production deployment, Drive sharing, Worker, D1 database, Google Form or analytics was created. This branch depends on the separate disconnect correction commit `d6fa96976f89e6063c1d801a7ae4ca1fc9488cb2`. Review the two changes separately before releasing either.

## User-approved test behavior

- A visitor can choose one local PDF (up to 50 MiB) without a Google account. The bytes stay in page memory, are not uploaded, and are not added to persistent storage or the shared catalogue. Leaving or reloading requires choosing the file again.
- Two licensed, unchanged PDFs are provided as public static site files for reading or downloading, with authors, dates, licences and official source links next to each file. They are not the owner's private library.
- Existing optional `drive.file` connection still selects files from the visitor's own Drive. New files must be uploaded to Drive outside Pilares. No upload function was added.
- No click/download counter, named log, mandatory login, feedback form or reference to 285 private files. Weekly aggregate counting for up to 52 weeks belongs to a later public-version proposal, not this no-count test.

## Rendering and privacy

PDF.js 6.4.299 (Apache-2.0) and its worker/fonts/CMaps/WASM/ICC resources are served from the same site. PDFs are rendered onto canvas; extracted page text is offered in an accessible/selectable disclosure. This is not a full tagged-PDF or screen-reader reading-order implementation. Scanned pages without extractable text are reported as such; there is no OCR. Page and zoom controls, focus trap, Escape and focus return are covered. Navigation is page-by-page. Password-protected files fail closed with a clear error; no password collection. Embedded JavaScript/actions, annotation links, forms, attachments and XFA are not executed or exposed. This does not promise absolute protection against defects in any PDF parser.

Only a file signature/size check precedes PDF.js structural parsing. Corrupt files get an error. Canvas allocation is bounded to 8 million pixels; large files can still use significant CPU/memory. The implementation has been tested in Chrome, not physically on Safari/iOS. PDF.js and sample files add download weight, not a speed improvement. PDF files and support resources are not automatically precached for offline use. Availability of the app shell offline does not guarantee availability of the samples or reader resources offline.

The privacy notice now explains the local reader and public samples without claiming counters exist. Existing unresolved controller/contact/legal-basis/provider-retention caveats were retained. This feature review is not legal approval to recruit external testers or a complete GDPR/WCAG audit.

## Licence evidence (verified 17 October 2026)

1. W. Russ Payne, *An Introduction to Philosophy*, Bellevue College, 2015. Original English, 130 PDF pages. CC BY-NC 4.0 explicitly allows copying/distribution/adaptation with attribution and non-commercial use. No translation or modifications supplied here.
   - Official edition: https://commons.bellevuecollege.edu/wp-content/uploads/sites/125/2017/04/Intro-to-Phil-full-text.pdf
   - Licence: https://creativecommons.org/licenses/by-nc/4.0/
   - Repository asset `public/library/payne-introduction-2015.pdf` is byte-identical to the currently downloaded official edition and the checked private-source copy.
   - SHA-256 `5a1b1ab09ee924d41bf82c7a580cec6dab13ff776c7365ed9bad210c48de1fc1` (877291 bytes).
2. Nilton Eliseu Herbes, Iuri Andréas Reblin and Marcelo Ramos Saldanha (organisers), *Teologia Prática: O pensar teológico em tempos sombrios*, Faculdades EST, São Leopoldo, 2020. Portuguese original, 152 PDF pages. The copyright page declares CC BY-NC-ND 3.0 Unported. Share only the unchanged original, non-commercially, with authorship/credits/licence preserved. No translation/adaptation supplied here.
   - Official edition: https://est.edu.br/wp-content/uploads/2024/01/Livro_Teologia_Pratica_2020.pdf
   - Licence: https://creativecommons.org/licenses/by-nc-nd/3.0/
   - Repository asset `public/library/teologia-pratica-2020.pdf` is byte-identical to the currently downloaded official edition and the checked private-source copy.
   - SHA-256 `42151a21924c730a672aac5549d22c10270b18c8d30b436a4fc37390d5263bfa` (1226664 bytes).

The PDFs retain their own licences, not a software licence. No promise of preventing copies. Non-commercial conditions and any separately credited third-party material must be respected. The private source index, private Drive IDs, account details and other PDFs are not included. Booklist expansion requires separate edition-level proof and QA before inclusion.

## Validation

- Production build passed; 51 unit tests passed; production dependency audit reports zero known vulnerabilities at check time.
- 18 new end-to-end scenarios passed: PT/EN real sample rendering and hashes across mobile/tablet/desktop; navigation, zoom, nonblank pixels, local-file network/storage isolation, reload/clear, fake/corrupt files, keyboard trap, Escape/focus return, extracted text, axe modal checks, password fail-closed and a valid synthetic PDF with an inert embedded script.
- The local reader/catalogue checks fail as expected on the item-3-only parent commit in all three viewports (the feature is absent), then pass here.
- The full disconnect suite passed 66/66 on this branch.
- Existing app/accessibility regression: 73 passed, 2 failed in the already unstable first-Tab skip-link check. The same check failed on unmodified main in the earlier disconnect review. Do not claim a fully green historical suite or a complete accessibility audit.
- Lint: 0 errors, 16 pre-existing warnings. Vendor support files are excluded from lint through `.eslintignore`; they retain their vendor licence notices.
- Actual catalogue screenshots inspected at 390/820/1280; PDF render screenshots inspected after an explicit render-complete marker, not merely canvas dimensions. A file-input overflow and native-dialog keyboard boundary were fixed. Render-readiness tests now assert finished render keys and actual nonwhite pixels.

Temporary QA configs select the installed Chrome executable and are not source changes. Independent supervisor review and a new owner approval of the exact remote SHA are required before merge/publication. Remote push is blocked pending a repository-specific credential; no unrelated credential will be used.
