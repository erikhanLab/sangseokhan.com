# Patch 5 — CSS consolidation and visual regression

## Scope
- Preserve all text, images, the intentionally subdued Home laboratory graphic, the six-step type scale, and the eight-step spacing tokens.
- Removed the duplicate `.nav a:hover, .nav a.active` `letter-spacing` override and two declarations superseded by the later 640px navigation rule in `assets/css/site-shell.css`.
- Kept the separate `type-scale.css`, `design-system.css`, and `interaction-rhythm.css` intentionally: these are distinct layers, not duplicate systems. A full merge would introduce risk without improving maintainability.

## Cascade notes
- `site-shell.css` imports the three token/behavior layers at its beginning. A selector later in `site-shell.css` may take precedence over a matching selector in an imported sheet. Import order alone does not guarantee that the interaction file wins.
- The retained `.nav a:hover` desktop and mobile overrides are necessary for existing behavior. Do not remove them solely because a similarly named rule exists in `interaction-rhythm.css`.
- In the final `@media (max-width: 640px)` block, `.nav a:hover, .nav a.active` defines the effective mobile letter-spacing; it supersedes the earlier mobile rules edited in this patch.

## Checks
- `npm run build` includes 17-route structural, content, quality and JavaScript syntax checks.
- For visual regression checks, compare matching Chromium screenshots of the previous and patched `dist/` at 320px, 390px, 768px and 1280px, using the same browser and fonts. Test hover and focus separately.
- Full-page pixel comparison can be affected by images or font-loading; any difference requires inspection rather than an automatic claim of visual equivalence.
