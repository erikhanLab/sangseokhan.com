# HAN v6 — Scholarly discoverability and indexing policy

This patch does **not** alter visible design, scientific figures, or publication text.

## Machine-readable researcher identity

- Canonical person: `https://sangseokhan.com/#person`
- Preferred personal-site display: `Sangseok Han`
- Scholarly-paper variant: `Sang-seok Han`
- Japanese variant: `ハン・サンソク`
- ORCID, Google Scholar and LinkedIn URLs come from `src/content/person.json`.
- All original displayed names and author ordering remain unchanged.

## WebPage versus paper

Each publication detail URL is a **WebPage describing** a separate
`ScholarlyArticle` entity (the publisher's work). The scholarly work's DOI
links to the original publisher record; the personal-site URL is not a second
scholarly publication. Conference presentations without published dates do not
invent one in the metadata.

The Research page has an `AboutPage` graph using only existing verified research interests, and the Publications index has an `ItemList` of the seven records.

## Selective indexing

- `beyond-resistance`, `temperature-ittc`: **index**, publisher OA / `CC BY 4.0` are recorded in the existing canonical data.
- `spatial-variability`, `naval-roughness`: **noindex**. No reusable **publisher version** licence is recorded in the canonical site data. An author-accepted manuscript of `spatial-variability` is separately available under CC BY; this does not automatically establish the same terms for the publisher version or each hosted figure.
- `cfd-spatial`, `wec-mpc`, `fowt-fsi`: **noindex**, publication/licence/reuse conditions not documented in the canonical record.
- All seven HTML detail pages retain `noimageindex` and no direct Google Scholar Highwire `citation_*` tags. Image rights and text indexing are separate policies.
- The sitemap is generated from the per-route index policy; noindex URLs are excluded.
- Current `robots.txt` Googlebot-Image restrictions are unchanged. Existing site-wide general crawler permissions are unchanged, including any permissions applying to AI search. This patch does not opt in or out of model training.

CAUTION: `noimageindex` is a Google indexing directive and should **not** be treated as access control or copyright enforcement. Direct figure URLs remain reachable and may still be accessed by other crawlers. If a licence or publisher policy changes, update verified canonical data and deliberately change `src/content/routes.json` together; audits enforce conservative CC BY indexing.

## HTML duplication cleanup

On the homepage, the only *identically worded* desktop/mobile research tagline node was consolidated into one DOM node. Other responsive variants contain intentionally different text or layout and were left unchanged to preserve the exact existing mobile presentation. Complete suppression of duplicate raw HTML text extraction would require a separate, more invasive responsive template refactor.

## Post-deployment verification

1. Verify Google Search Console URL Inspection for the two newly indexable URLs and their rendered HTML/robots policy; submit the updated `/sitemap.xml`.
2. Check canonical, visible H1, and DOI against the publisher record on each page.
3. Confirm Search Console does not report unexpected image indexing; `noimageindex` is not blanket image protection.
4. Confirm real crawler behaviour and server-side HTTP headers. Static build validation is not proof of indexing or inclusion in ChatGPT Search.
5. If another indexable journal record is desired, confirm publisher reuse rights first.
