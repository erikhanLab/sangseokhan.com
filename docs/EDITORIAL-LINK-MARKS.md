# Editorial Link Marks — Patch 10

- External/open-new-tab links: small staggered open corners instead of `↗`.
- Local route/section navigation: slender terminal rule instead of `→`.
- Back and back-to-top navigation: the same restrained geometry.
- DOI links are intentionally excluded from link-marker treatment.
- Home selected-work DOI: caption-scale, quieter color, reduced letterspacing.
- Publications DOI: no label underline or hover underline (keyboard focus outline remains).

The CSS geometry is centralized in `assets/css/editorial-link-marks.css`. In HTML, decorative markers have `aria-hidden="true"`. No research graphics, textual content, URLs, or outgoing link targets were changed.
