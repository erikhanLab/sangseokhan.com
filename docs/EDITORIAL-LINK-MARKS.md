# Editorial Link Marks — Patch 11 refinement

## Link semantics
- External destination: a slim north-east arrow (↗), without a box or corner frame.
- Internal forward navigation: a clear horizontal right arrow (→).
- Back and back-to-top: clear left and up arrows (← / ↑).

Icons are small, muted, and standardized in `assets/css/editorial-link-marks.css`, with screen-reader-hidden marker spans. Links and destinations were not changed.

## Publications DOI
- Removed the remaining hover underline rule in `src/templates/publications-index.html`.
- Anchor and label borders, shadows, and text-decoration are explicitly removed in the shared stylesheet, including hover and focus states.
- Keyboard focus still has a visible outline.
- Version query updated to `v=2` so previously cached marker CSS cannot mask the update.

The same stylesheet is linked by all 17 generated pages; only its version reference and the Publications template required HTML changes. No text, data, content ordering or site visualizations were altered.
