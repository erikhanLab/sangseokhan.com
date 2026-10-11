# Patch 6 — Optical refinement

The six type-size tokens in `assets/css/type-scale.css` are unchanged. This patch targets ordinary prose inside `.section` and `.subsection` only, applying conservative line-height values (1.68 desktop, 1.64 mobile), balanced final lines where `text-wrap: pretty` is supported, and break-word wrapping for long links. No manual line breaks or content edits; research figures, timeline diagrams, and the faint home illustration are out of scope.

## Review checklist
- Compare before/after screenshots at 320, 390, 768 and 1280px at matching fonts and viewport dimensions. Some deliberate paragraph line-break and vertical-layout differences are expected.
- Review Home, Profile, Research, Publications, Archive, and individual publication pages.
- Confirm no horizontal overflow, clipped labels or links.
- Revert a selector if its effect damages carefully composed content.
