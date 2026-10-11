# Interaction & editorial rhythm

This patch builds on `TYPE-SCALE.md` and `DESIGN-SYSTEM.md`.

- Navigation hover, active and keyboard focus share a consistent navy contrast; hovering no longer shifts navigation positions.
- Keyboard focus is visible on links, buttons, form controls and other tabbable elements.
- Inline links use a quieter, consistent underline treatment and hover affordance.
- Section anchors clear the sticky nav. Headings balance across lines.
- Section heading-to-group rhythm uses existing `--flow-*` tokens.
- Motion-reduction preferences are respected.
- No substantive content, type scale, homepage research graphic, archive illustration or timeline geometry is changed.

`assets/css/interaction-rhythm.css` contains all new interaction and editorial rhythm rules. Its import lives in `assets/css/site-shell.css`.
