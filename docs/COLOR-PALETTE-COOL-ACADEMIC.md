# Cool Academic — implemented palette

This patch applies the approved **A. Cool Academic** color study site-wide.

## Colors

- Background: `#F1F3F5` (previously `#EDEFF3`).
- Primary navy: `#0B1F3A` (unchanged).
- Editorial text: `#28384B` / heading `#152B45`.
- Muted text: `#526376`; secondary metadata `#63758A`.
- Steel-blue accent: `#56758A` (previously `#5A6A7A`).
- Interior navigation surface: `rgba(229, 236, 242, .97)`.

## Maintenance

Edit color tokens and semantic color rules in `assets/css/cool-academic.css`.
The build script injects that CSS at the end of the `<head>` of every generated route and the 404 page, **after** page-specific styles, so the final cascade matches the approved Home and Publications previews.

The previous 6-step typography and 8-step spacing systems are untouched.
The home research graphic's artwork, transparency, and position are untouched.
Publication figures and custom charts are intentionally not recolored.

## Deployment

- Source workflow: overwrite project-root paths from the patch, then run `npm run build`.
- Static hosting: overwrite the `dist/` files from the patch into the deployed site root, **not** into a nested `dist/` folder.

Do not install a palette-only patch on a different site revision without testing; it was compared against the Patch 6 Optical Refinement baseline.
