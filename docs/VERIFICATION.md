# First playable verification

The original game's code and data were not used for these tests.

- 28 deterministic and HTTP integration checks pass, including 20 distinct seeded campaigns traced for up to 16 quarters with cash reconciliation on every closed account.
- The browser playtest at desktop and 390×844 phone size founded a company, queued research, closed Q1, requested an Arc Research licence, reviewed its counteroffer, committed it in Q2, launched a licensed product and closed Q3.
- The final browser report showed 462 served accounts, $554,400 revenue, $66,528 royalties, $542,028 operating costs, $75,000 launch setup and $2,486,312 closing cash. These are results from the disposable test campaign, not the player's original save.
- The phone workspace had a 390px document width at a 390px viewport. The named Chief of Staff and bottom navigation remained available. No old stacked drawers are used.
- Browser testing caught and repaired a malformed quarter-confirmation option. A repeated commitment cannot be queued twice. In-flight delivery identities are retained for reconciliation and cannot be overwritten by another submission. Background reply status reads do not repaint the form when the server revision has not changed.
- An ended campaign can be archived and restarted without erasing its history; retries do not create duplicate archives.
- GitHub Actions builds the application and its native ARM64 image from committed source. Release identity is available at `/api/health`; runtime deployment and live-provider receipts are recorded by the operator separately after verification.

## Limits

These checks establish the tested paths, not a claim that the game is bug-free or its economy historically calibrated. Scenario prices and coefficients remain fictional. The design currently concentrates on the founding and operating-company campaign; the README lists grand-strategy systems that do not yet exist. Live conversation requires the separate server-side ChatGPT connection; tests do not provision or expose credentials.
