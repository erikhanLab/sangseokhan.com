# HAN v4.3 → v6 — Scholarly Discoverability & Identity

## Apply

This **minimal source patch** is for the **HAN v4.3 project source** (v4.1 + v4.2 + v4.3), not for built `dist/` alone.

1. Back up your working repository.
2. Unzip this archive **inside your project's root**, where `package.json` is.
3. Overwrite the matching 10 files; preserve the project structure.
4. Run `npm run build` and inspect `dist/sitemap.xml`, `robots.txt`, the publication HTML metadata, and page behavior.
5. Deploy the newly built `dist/` with your existing GitHub Pages workflow. Site deployment is **not** performed by this patch.

## Design and content

- No CSS, visible layout, wording, images, figure content, or publication bibliography changed.
- One identical desktop/mobile homepage research tagline node was consolidated to avoid duplicate HTML text; rendered desktop/mobile screenshots are unchanged.
- v4.3 adaptive paper left navigation and all v4.1 interactions are preserved.

## Publication index policy

Newly `index, follow, noimageindex`:
- `/publications/beyond-resistance/` (OA, CC BY 4.0)
- `/publications/temperature-ittc/` (OA, CC BY 4.0)

Remaining five publication detail pages: still `noindex, follow, noimageindex`.
The `sitemap.xml` generator now includes exactly these two newly indexable URLs.
The existing `robots.txt` and image-crawler restrictions were not changed.

## Semantic data

- Canonical Person @id + `alternateName` for academic name and Japanese spelling
- ORCID, Google Scholar, LinkedIn from existing `person.json`
- ProfilePage mainEntity uses the same identity
- Publications ItemList and Research AboutPage
- Seven publication detail pages: WebPage (portfolio record) describing a separate ScholarlyArticle (publisher work), with correct DOI and author order. No invented publication dates for unpublished conference proceedings.

## QA (performed locally)

- `npm run build`: all 17 authored routes, 8 indexable URLs, existing static link/content/JS audits pass
- Playwright Chromium: unchanged screenshots at 390, 768, 1023, and 1440 px on key pages; no runtime page errors or horizontal overflow
- No non-HTML built asset changes except `/sitemap.xml`; research figures and video assets byte-identical
- Search indexing / ChatGPT discoverability cannot be guaranteed by a local build. Re-check after deployment in Google Search Console.

Detailed search/copyright policy: `docs/discoverability-policy.md`.
