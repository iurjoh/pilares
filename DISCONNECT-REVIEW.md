# Google disconnect correction

Local review only. No production change or Google account permission was changed by these tests. The two-mode library proposal and access logging are separate work and are not implemented here.

## Behavior

- One service for Library, Settings and Delete all data.
- Local token and PDF selection are cleared before waiting for Google. Local removal is verified and failures are reported honestly.
- A valid token, including one inside the API request 30-second safety margin, can be used for revocation. Missing, corrupt or expired tokens do not trigger a new consent request.
- Google success requires `RevocationResponse.successful === true`.
- Script loading and callback wait are bounded together to 5 seconds. A script loaded after timeout cannot start a late revocation request.
- The status separates local cleanup from account-level revocation. A failed/unavailable result provides the Google Account connections link.
- A non-secret receipt survives the erase/reload path. A local storage signal clears the session token in other tabs and closes their reader. Pending Picker replies are invalidated.

## Validation

Production build passed. 45 unit tests passed (33 existing, 12 new). The disconnect end-to-end suite passed 66 cases: 3 entry points x 7 states x 3 viewports, plus another-tab token/reader checks. Google network behavior is mocked; no real account grant was revoked. States include successful callback, failed callback, no callback, missing token, expired token, near-expiry token, and blocked script. PT and EN notice layouts were visually inspected at mobile/tablet/desktop widths.

Fail-before: the new settings failure/hang/expired scenarios all fail on unchanged main 069e0222fa4b6a18e2e7bc1b69708a09ecfdbad9, then pass with this correction.

Existing app/accessibility tests: 72 passed, 3 failed in the old first-Tab skip-link focus test. That focus failure also reproduced on the unchanged base with the same Chrome executable (2 failed, 1 passed), so it remains a separate flaky test, not silently fixed in this change. Lint has 0 errors and 16 warnings. This is not a full WCAG audit.

## Release gate

Independent review and an exact-commit approval are required before merge. No actual Google revocation test, two-mode library, analytics, tester login or download tracking is included. The saved git credential used for another repository returned 403 on a dry-run push to Pilares; no Pilares remote write occurred. Publication needs an authorized repository route; do not broaden credentials silently.
