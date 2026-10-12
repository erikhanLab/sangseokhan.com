# Type hierarchy rebalance — desktop and mobile

This patch reassigns content roles **within the existing six-step type scale**.
The values in `assets/css/type-scale.css` are unchanged.

| Role | Desktop | Mobile | Examples |
|---|---:|---:|---|
| Caption | 12 px | 12 px | year, date, DOI, source labels, minor tags |
| Small | 14 px | 14 px | authors, journal/venue, related-output entries, contextual copy |
| Body | 16 px | 16 px | publication title, event details, mobile project titles |
| Lead | 20 px | 18 px | section headings and major research headings |
| Heading | 32 px | 28 px | major page headings |
| Display | 56 px | 38 px | Home display name |

## Specific corrections

- **Home mobile Recent:** time `12px` / event `14px` / journal or institution `12px`. Desktop rail event `14px` / time and source `12px`.
- **Publications:** title `16px`, author `14px`, venue `14px`, year `12px`. Mobile DOI `12px`, forthcoming state `12px`. The desktop DOI retains its existing small-link role.
- **Research:** the main project title is `20px` on desktop and `16px` on mobile; Related Outputs heading `12px`, entries `14px`, year `12px`. Mobile topic chips remain `12px`. Research in Context heading is `18px` on mobile.
- **Profile:** Current appointment role remains `16px`; institution and affiliation are `14px`, date `12px`. Mobile appointment record year becomes `12px` and Features article titles `14px` rather than `12px`.
- **Timeline:** mobile event labels are `14px`; subordinate categories are `12px` (previously `16px`).
- **Research Log:** context metadata becomes `14px` on desktop.
- **Research Connections & Visits:** publication venue/source becomes `14px` instead of `16px`.

## Deliberately unchanged

- The six font-size variable values and the spacing/color systems.
- Site content, translations, affiliations, bibliography and all link targets.
- Graphics, image treatments, and Archive's own editorial display structure (where a `.record-meta` is actually a thematic title, not secondary metadata).

## Verification

- `npm run build`: all 17 routes and existing source, content, accessibility and JavaScript syntax audits passed.
- Chromium computed-style checks for 17 routes at 320, 390, 768 and 1280 px (68 route/width combinations): no horizontal document overflow detected.
- Home Recent's dynamically inserted markup was separately checked at 320 and 390 px, confirming `12/14/12px` and no overflow.
- Visible content and link destinations are unchanged; the related-output year only gained a semantic wrapper for typographic styling.

The patch should be copied over the existing site source tree. `dist/` contains the matching rebuilt output, but the authored sources remain canonical.
