# CabLine — how the code is organised

CabLine is one web page (`index.html`) served by GitHub Pages. It works offline and syncs through Firebase.
Search for the section name (e.g. `// ===== v393: JOBS HOME`) to jump to a feature — line numbers move, names don't.

| Area | Search for | What it does |
|---|---|---|
| Sign-in & people | `CLOUD ROLES`, `ADMIN_EMAIL`, `rcSignIn` | Email + password sign-in, email confirmation, admin approval |
| Roles & access | `ROLES (v207)`, `ROLE_VIEWS`, `ujNorm` | What each section (Designer, QC & Dispatch, Installer) sees, per job |
| Cloud sync | `cloudStart`, `cloudPushJob`, `syncMerge` | Live sync of jobs; saves run in a transaction and are merged three-way with the last common version |
| Files & photos | `SAFE UPLOAD QUEUE`, `upPut`, `siGetPhoto` | Files kept on the device and uploaded in pieces to `photos` |
| Jobs page | `v393: JOBS HOME`, `JH_STAGES` | Every job, its stage, delivery colours, orders & invoices |
| Cabinet list & prints | `BY MATERIAL`, `Section 1: PTO`, `Hardware Items` | Excel import, categories, printable lists |
| Finishes & appliances | `FINISHES & APPLIANCES CHECKLIST`, `SIMPLE Material Schedule` | Appliances, stone and material schedule sheets |
| Client page & approval | `CLIENT SELECTIONS LINK`, `clSignHTML`, `clApprove`, `clUnlock` | The client's link, sign-off, approval for production, history |
| Client notes | `CLIENT BRIEF`, `brSave` | Notes copied from emails, by topic, with versions and done ticks |
| Email | `v401: EMAIL`, `mailCompose` | Opens each person's own Outlook/Gmail to write to a client |
| Shared settings | `SHARED SETTINGS`, `appSetPut` | Settings stored on the server (topics, company details, rod deduction) |
| QC / Dispatch / Install | `BARCODE SCANNER`, `doQcScan`, `doInstallScan` | Scanning and progress |
| Maintenance | `v393: MAINTENANCE page` | After-install call-outs, printable |
| Storage & backups | `STORAGE meter`, `AUTO-BACKUP` | Space used per project, backup and restore |
| Updates | `AUTO-UPDATE CHECK`, `sw.js` | Finds new versions and updates by itself when you are not typing |

## Other files
- `firestore.rules` — server security rules. Paste into Firebase › Firestore › Rules and Publish after any change.
- `sw.js` — offline support. The page itself always comes fresh from the server when online.
- `version.json` — the published version number (used by the update check).
- `tests/smoke.js` — automatic checks of the main flows. They run on GitHub after every change (`.github/workflows/tests.yml`).
- `tools/bump.py` — raises the version number in every place it must change.

## Making a change
1. Edit `index.html`.
2. `python3 tools/bump.py`
3. `node tests/smoke.js` — everything must pass.
4. Commit and push to `main`.
