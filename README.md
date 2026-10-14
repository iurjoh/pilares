# Pilares

[Português (Brasil)](README.pt-BR.md) | **English**

Track small habits and reflections across five areas of life. Record one step today and revisit your progress in one place, without an account for core use.

## Demo

[Open the live app](https://pilares.pages.dev/)

Open in your browser. No installation or terminal required.

![Pilares water control: amount consumed, daily summary and a separate daily-goal field](docs/assets/pilares-water-en-2026-10-11.png)

English interface captured on 2026-10-11 with no personal records. Labels follow your chosen app language.

## Try one small step

1. Open the demo and choose **Physical**. On a phone, use the pillar navigation or the home cards.
2. In **Water for the day.**, type `0.5` in **Or type it in liters** (not **My daily goal (liters)**). The summary should show the recorded amount.
3. Open **Settings** to switch between English and Portuguese. Use fictional entries while exploring; your progress belongs to this browser.

No Google login is needed for this first use. The optional personal library uses Google sign-in and selected Drive files.

## What you can use

| Space | Examples |
| --- | --- |
| Spiritual | Bible chapter references, reading completion and weekly practices. |
| Mental and Emotional | Mood check-in, optional notes and a calendar. |
| Physical | Water, sleep, movement and eating habits. |
| Intellectual | Reading minutes, learning notes and an optional cloud library. |
| Financial | Monthly checklists and goals you define. No banking connection or investment advice. |

English and Portuguese share the same interface. Core progress is local; it is not automatically synchronized across devices.

## Status and limits

Evolving beta. The five spaces exist, but implemented features and a green build are not a full accessibility certificate or a guarantee of data recovery.

- Clearing site data or changing devices can lose progress. There is no automatic backup.
- Settings includes data export and delete-all controls. Exported files can contain sensitive notes; keep them private.
- Google access is optional. The `drive.file` scope limits accessible files but is not a read-only scope. Users select PDFs; choosing a folder does not grant its contents.
- The app is not an encrypted vault. Take care on a shared browser profile.

## Testing

The QA work developed on `feat/qa-local` adds:

```sh
npm run qa
```

This command combines Vitest and Playwright. The new spec checks navigation across five pillars and a mood, note, practice and screen-time entry across reload, using fictional data; it also checks accessibility after interaction. Candidate tests do not certify every feature or real OAuth. At the start of this review (2026-10-11), main at be097e4 did not yet include this command.

## Project history

The project began with five independent spaces in a shared shell, then added local progress, languages and visitor-selected library access. Privacy work removed the owner's private library listing from the public interface.

A 2026-09-28 audit recorded accessibility, security and performance findings. Historical results stay in the build record; they are not today's unresolved issue count.

[Build story, architecture, design decisions and historical audits](docs/BUILD.md)

## Credits and license

Iuri Johansson defines the project direction and decisions; Instinct assists with implementation and documentation.

[MIT license](LICENSE), copyright 2026 Iuri Johansson. Libraries, services and other content keep their own terms. The Bible plan uses chapter references, not a republished translation; its original chapter-count sources remain in the build record.

## Technology and effort snapshot

Captured from repository sources on 2026-10-14. This is a source snapshot, not a claim about production versions or the technology available at the original launch.

- **Stack at this snapshot:** React 19.3.0; TypeScript 7.0.2; Vite 8.3.3; Tailwind CSS 4.3.3 (package-lock.json).
- **Earlier record:** React ^19.2.8; TypeScript ~6.0.2; Vite ^8.3.0 in the first surviving package.json, 1505e4b. These are declared ranges, not resolved installation versions.
- **Observed calendar window:** 2026-09-28 to 2026-10-11: surviving commits reachable from main. Calendar span, not continuous work or time to launch.
- **Pull requests:** 22 visible PRs: 1 open, 21 closed, captured 2026-10-14 before this documentation change. Closed does not mean merged. Deleted/recreated history is excluded.
- **Decision and reason:** Local IndexedDB keeps core habit tracking usable without an account; optional file selection avoids publishing a private library.
- **Estimated active effort:** unavailable. No reliable time log or bounded work-session reconstruction was established. Commit count and elapsed calendar time are not converted into hours.

Evidence: current dependency/source files named above, retained Git history and the repository PR list. Versions and counts are fixed to this snapshot, not live counters.
