# Sangseok Han — website source (cleaned)

## Folder structure

- `src/` — canonical authored HTML, content and page styles/scripts
- `assets/` — static images, figures, shared CSS and JavaScript
- `scripts/` — build and QA checks
- `dist/` — **generated deployment folder** (after building)
- `package.json` — build/test commands

## How to build

Node.js (22 tested):

```sh
npm run build
```

The command rebuilds `dist/` and runs source, routing, content, quality and JavaScript checks. No `node_modules` directory is shipped. `npm ci` is needed only for development/watch tools, not for a normal build.

**GitHub Pages / static hosting:** publish **only the contents of `dist/`**, not the repository root and not the parent folder itself. Keep `CNAME` if serving sangseokhan.com.

## Desktop-only visual refinement

`assets/css/desktop-type-tuning.css` is included last by `scripts/build.mjs` on all generated pages, inside a `min-width:1024px` CSS media query. It adjusts desktop heading/nav tracking and subtle text contrast only. At 1023px or less its rules have no effect. Fonts, text, research figures and layout are unchanged.

## What was cleaned

Removed redundant root HTML snapshots, obsolete copied route directories, embedded Git object history, `node_modules/`, and stale `dist/` from the uploaded bundle. The deployable `dist/` in the accompanying release ZIP is freshly generated from the canonical `src/` files.

Original research images and data assets have not been re-generated, recompressed or modified.
