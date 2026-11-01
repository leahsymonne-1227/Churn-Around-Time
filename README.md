# Churn Around Time

A Material UI React prototype for reviewing customer churn signals. The first-launch model is account-free and session-only: no upload history, Supabase connection, or server-side file storage. Customer files are parsed in the browser, and the review exists only in the current page session. Users can download a CSV before leaving.

## Run the preview

1. Install Node.js 20 or newer.
2. In the VS Code terminal, run `npm install`.
3. Run `npm run dev` and open the local address Vite prints (usually `http://localhost:5173`).

Sample data works without any API credentials. CSV, XLSX, and text-based PDF files are read in the browser (the XLSX reader is a small built-in one, so no spreadsheet library is downloaded). Closing or refreshing the page resets the data to the sample set; uploaded content is not written to browser storage or a database. Scanned-image OCR is not included. The local preview score is a demo heuristic, not a validated churn model.

## Optional OpenAI analysis

The AI endpoint is disabled until configured. To enable it locally, copy `.env.example` to `.env.local`, set `OPENAI_API_KEY`, then restart `npm run dev`. The secret stays on the server and must never be placed in a `VITE_` variable or committed to source control. Users see a confirmation before sending extracted customer and company names, notes, signals, call counts, and mention counts to OpenAI. The original file is not sent in the AI request.

The local API applies a starter per-IP request limit and caps request size and record count. That is not sufficient abuse protection for a public, anonymous launch; use additional bot controls, account or usage limits, monitoring, budget alerts, and production-grade rate limiting before exposing an AI key publicly. OpenAI states that API data is not used for training by default; standard abuse-monitoring logs may retain content for up to 30 days. Review the current [API data controls](https://developers.openai.com/api/docs/guides/your-data).

## Later: saved history and accounts

Saved history across visits or devices requires an identity and persistent backend. If history stores analysis results only, a database is enough; keep original files in object storage only if customers need to reopen or reprocess them. The initial product does not connect to Supabase. A preliminary future schema is preserved at [`future/supabase-schema-draft.sql`](future/supabase-schema-draft.sql) for discussion; it is not applied or used by this app. Before enabling accounts, finish company workspaces, invitations and roles, retention and deletion flows, audit logs, and security review.

## Before production

This is a prototype, not a production deployment. Before processing real customer data, review privacy terms, file type/content validation, malware scanning, retention and deletion, access roles, audit logs, backups, OpenAI data handling, and company-specific workspace isolation. PDFs are text-extracted; scanned-image OCR is not included. The current local preview scoring is a demo heuristic, not a validated prediction.

## Project layout

- `src/App.jsx` holds the app state and decides which step to show (Upload, Analyse, Customer register).
- `src/components/` has one file per screen plus small shared pieces (`Parts.jsx`) and the dialogs.
- `src/lib/` has the logic with no UI: `scoring.js` (the formula), `rows.js` (spreadsheet rows to customers), `files.js`, `xlsx.js`, `pdf.js`, `save.js` (CSV export) and `ai.js`.
- `src/theme.js` and `src/styles.css` hold the look. Colours that change between light and dark are CSS variables at the top of `styles.css`.
- `server/index.js` is the optional AI endpoint. It checks everything the model sends back before the page uses it.

## Static copy

`VITE_NO_API=1 npm run build` builds a copy that never calls `/api`, for hosting without the server.
