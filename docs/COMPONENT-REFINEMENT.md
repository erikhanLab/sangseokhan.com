# Patch 9 — Contrast & Component Refinement

## Purpose

Light-touch visual polish on top of the approved **A. Cool Academic** palette. No
content, page layout, typography tier, or Home research graphic edits.

## Tokens

`assets/css/component-refinement.css` provides semantic tokens for secondary
text, captions, steel-blue links, two divider strengths, and research tags.
The upstream palette in `cool-academic.css` remains unchanged.

## Components refined

- **Global:** footer supporting text and quiet navigation labels.
- **Profile:** dates, sources, action links, section rails and item dividers.
- **Research:** topic pills, output captions, institutions metadata, labels and
  dividers. Research illustrations and visualization colors untouched.
- **Publications:** summary hairline, metadata and the understated DOI underline.

Text reference contrast on the page background `#F1F3F5`:
secondary `#526376` about **5.54:1**, caption `#566C80` about **4.90:1**.
Contrast on overlay surfaces can vary.

## Maintenance / deployment

The build script loads `component-refinement.css` **after** the approved palette
on each route and the 404 page. CSS is intentionally limited to color,
background-color and border-color; the DOI underline changes only border
thickness on an inline label, not layout geometry. For source builds, place
files at project-root paths and run `npm run build`; for static deployment,
copy the contents of `dist/` to the web root.

No research materials, copy, dates, images, videos, or HTML source are edited.
