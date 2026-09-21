# Verification ledger

2026-09-21. Built-in imagegen concept: `concept.png`. Browser testing started in Codex IAB. IAB viewport overrides produced inconsistent CSS dimensions and cropped captures, so Playwright CLI with the installed Chrome was used for reproducible visual QA. Desktop 1440×1000 and mobile 390×844; mobile document width exactly 390, no overflow. `view_image` inspected concept and desktop implementation together, then full mobile capture. Native concept file is 1504×1044 (same approximate aspect as desktop); implementation tested at 1440×1000.

| Comparison | Result |
| --- | --- |
| Header and brand | Same open wordmark/nav composition and thin rule |
| Layout | Same two-column editor/report with central divider; mobile stacks |
| Typography | Same hierarchy; corrected Chinese fallback to installed Microsoft YaHei UI |
| Palette | White background, forest-green controls and chart, muted gray rules |
| Data display | Six axes, total, six metric controls and export match concept |
| Copy | Heading/nav/buttons unchanged; explicit consent/privacy and input limits added for working product |
| Motion | Measured pending request; reduced motion respected; bars captured after transition |

Intentional functional extensions: initial empty report, real model/rubric identity, selected-dimension reading prompts and distributions, full rubric, privacy explanation, input validation and stale-result warning. No claim that these extra states appeared in the generated concept. No bitmap screenshot used as application UI.

Functional checks: nine backend tests passed; production build passed; live Jev test returned HTTP 200, model jev-1.13.0, six valid scores. Browser confirmed empty-input/consent checks, result rendering, report export, stale-result warning and complete ten-level accordion. Export inspected: includes original model/rubric, excludes submitted essay. Original rubric file compared unchanged. Synthetic QA essay contains no user's personal material. Install audit reported zero vulnerabilities.

Quota boundary accepted by user: free Render instance, in-memory 6 requests/network/hour and 100 provider attempts/UTC day, three concurrent; resets on process restart. This is not a durable billing cap.
