# Home Kinetic Line Field

This patch adds a restrained animated visual to the Home page only.

## Intent
- Introduce a visual signature without disturbing the site's quiet academic tone.
- Keep the motion soft, blurred, and slow.
- Preserve the existing Cool Academic palette and typography system.

## Placement
- The kinetic field is positioned in the `research-transition` region on the Home page.
- It sits behind the affiliation / overview / selected work block.
- It does not replace the existing roughness graphic.

## Implementation
- Markup: `src/pages/home.html`
- Script: `assets/js/home-kinetic-field.js`
- Deployment output: `dist/index.html` and `dist/assets/js/home-kinetic-field.js`

## Accessibility / behavior
- Decorative only (`aria-hidden="true"`).
- Ignores pointer input.
- Honors `prefers-reduced-motion`: animation stops and the field renders as a static composition.
- Visibility-aware: animation pauses when the field is not in view.

## Tuning points
If you want to make it quieter or stronger later, the main control points are:
- `.kinetic-line-field` opacity in `src/pages/home.html`
- line count / amplitudes / alpha values in `assets/js/home-kinetic-field.js`
