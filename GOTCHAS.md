# Gotchas

Living list of pitfalls that already bit this project. Add every new one with its date. Once a month, lessons that apply everywhere are promoted to AGENTS.md.

- 2026-10: a personal email address was removed from the privacy page by the owner's rule - never reintroduce personal contact data anywhere in the app.
- 2026-10: quick-exit lost unsaved state (save-on-quick-exit bug). Any exit path must persist state first.
- 2026-10: the Google disconnect flow must fully revoke the grant (item 3, QA-approved); test revocation, not only disconnection.
- 2026-10: the virtual library publishes a file only after edition, source and licence are verified (positive list, one entry per file). No bulk publishing.
- Content is PT-BR/SV/EN: review strings in all three languages; mixed-language UI has slipped through before.
