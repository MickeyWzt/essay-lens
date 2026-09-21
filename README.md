# 见文 · Essay Lens

A Chinese-language public workspace for evaluating English undergraduate personal essays with TypeSafe Jev and a transparent six-dimension radar chart.

## Run

Node 22.16+; `npm ci`, `npm run build`, set `TYPESAFE_API_KEY` in the environment, then `npm start`. Open http://localhost:3100. For frontend development run `npm run dev` alongside the server. `npm test` checks the API contract, validation, aggregation, rate limits, privacy and upstream failure paths.

## Render

Deploy this directory as its own repository. Node web service, Singapore, free instance, `npm ci --include=dev && npm run build`, `npm start`, health check `/health`. `render.yaml` is also supplied. Set `TYPESAFE_API_KEY` as a private server environment variable. Never put it in a Vite variable or commit it. The frontend never receives this key.

Set `DAILY_EVALUATION_LIMIT` (default 100), `TRUST_PROXY_HOPS` (default 1 for the Render proxy), and `PORT` (provided by Render). Set daily limit to 0 to disable upstream calls. One instance only. Each network receives at most 6 attempts/hour; at most 3 upstream requests run concurrently. All attempted provider calls, including failures, consume a daily slot. There are no automatic upstream retries.

**Quota boundary:** counters are in memory, use UTC days, and reset on restart or redeployment. Render free services have ephemeral storage and can spin down. This is best-effort abuse protection, not a durable daily budget or a financial spending cap. Use a persistent shared quota store before scaling or promising a strict daily cap. Configure provider-side budget limits when available. Free hosting may have cold starts; host availability is independent of Jev.

## Evaluation provenance

`server/rubric.json` preserves the exact original `jev-neutral-evaluation` rubric: six questions, 60 level descriptions, neutral context, fixed `jev-1.13.0`. Submitted state is `{task_context, essay}`. The backend sends all six questions in one request to `https://api.typesafe.ai/v1/systemone`; no author metadata, previous scores, user-selectable rubric overrides or admissions labels are included.

Each score is 0–9. Total = sum / 54 × 100; the frontend rounds only for display. This is a custom, uncalibrated rubric inspired by broad public admissions advice, not an official rubric, an admission prediction, an AI-authorship detector, or a fact checker. Jev returns typed scores and distributions, not generated feedback. The reading prompts are fixed editorial aids and labeled accordingly.

Sources: https://docs.typesafe.ai/api / https://docs.typesafe.ai/primitives/score / https://docs.typesafe.ai/patterns/composite-scoring / https://admissions.yale.edu/essays / https://apply.jhu.edu/college-planning-guide/essays-that-worked/

## Privacy and scope

Essay text is forwarded to TypeSafe only after explicit in-page consent. No application database, request-body logging, analytics, cookies or local storage. Scores stay in tab memory until cleared/refreshed; downloaded Markdown includes scores, distributions, rubric and provenance, but not the essay. Render may retain routine access metadata. TypeSafe's own privacy policy applies to the external inference request. No personal essays or original private evaluation results are bundled. The built-in demo is labeled synthetic interface data.

The first version supports pasted text and UTF-8 TXT import, radar and accessible numerical score controls, exact rubric disclosure, probability inspection, Markdown export and print-to-PDF. School-specific prompt evaluation, uploads of Word/PDF, accounts, cloud history and human editorial commentary are not included.
