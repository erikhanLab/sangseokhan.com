import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderStandardHeader,
  renderStandardNav,
  renderStandardFooter,
  renderLanguageBootstrap,
  homeJsonLd,
  profileJsonLd,
} from "../src/components/site-shell.mjs";
import { publicationPageJsonLd, publicationsIndexJsonLd, researchPageJsonLd } from "../src/components/scholarly-metadata.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SITE = "https://sangseokhan.com";

const readJson = async (rel) => JSON.parse(await readFile(path.join(ROOT, rel), "utf8"));
const readText = async (rel) => readFile(path.join(ROOT, rel), "utf8");
const esc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const escJson = (value) => JSON.stringify(value, null, 2).replace(/<\/script/gi, "<\\/script");
const yearOf = (date = "") => String(date).slice(0, 4);

const person = await readJson("src/content/person.json");
const site = await readJson("src/content/site.json");
const publications = await readJson("src/content/publications.json");
const routes = await readJson("src/content/routes.json");
const generatedPages = await readJson("src/content/generated-pages.json");

function replaceTokens(source, values) {
  let out = source;
  for (const [token, value] of Object.entries(values)) out = out.replaceAll(`__${token}__`, String(value));
  const leftovers = [...out.matchAll(/__[A-Z0-9_]+__/g)].map((m) => m[0]);
  if (leftovers.length) throw new Error(`Unresolved template token(s): ${[...new Set(leftovers)].join(", ")}`);
  return out;
}

function replaceBalancedElement(html, tag, predicate, replacement, occurrence = 1) {
  const openRe = new RegExp(`<${tag}\\b[^>]*>`, "gi");
  const opens = [...html.matchAll(openRe)].filter((m) => predicate(m[0]));
  const startMatch = opens[occurrence - 1];
  if (!startMatch) throw new Error(`Could not find <${tag}> element to replace`);
  const tagRe = new RegExp(`</?${tag}\\b[^>]*>`, "gi");
  tagRe.lastIndex = startMatch.index;
  let depth = 0;
  let match;
  while ((match = tagRe.exec(html))) {
    if (match[0].startsWith(`</`)) depth -= 1;
    else depth += 1;
    if (depth === 0) return html.slice(0, startMatch.index) + replacement + html.slice(tagRe.lastIndex);
  }
  throw new Error(`Unbalanced <${tag}> while replacing element`);
}

const hasClass = (name) => (openTag) => new RegExp(`class=["'][^"']*\\b${name}\\b`, "i").test(openTag);
const hasId = (id) => (openTag) => new RegExp(`id=["']${id}["']`, "i").test(openTag);

function routeFile(root, route) {
  if (route === "/") return path.join(root, "index.html");
  return path.join(root, route.replace(/^\//, ""), "index.html");
}

async function copyStaticFiles() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await cp(path.join(ROOT, "assets"), path.join(DIST, "assets"), { recursive: true });
  // Large legacy GIFs are retained only as source-history fallbacks; production uses video.
  for (const rel of ["assets/research/fowt-pitch.gif", "assets/research/wec-cfd-mbd.gif"]) {
    await rm(path.join(DIST, rel), { force: true });
  }
  for (const file of ["favicon.ico", "googlef5cfb479256c421d.html", "CNAME"]) {
    await cp(path.join(ROOT, file), path.join(DIST, file));
  }
  await cp(path.join(ROOT, "src/pages/404.html"), path.join(DIST, "404.html"));
}

async function copyGeneratedPageAssets() {
  const cssDir = path.join(DIST, "assets", "css", "pages");
  const jsDir = path.join(DIST, "assets", "js", "pages");
  await mkdir(cssDir, { recursive: true });
  await mkdir(jsDir, { recursive: true });
  for (const page of generatedPages) {
    await cp(path.join(ROOT, page.style), path.join(cssDir, `${page.assetKey}.css`));
    await cp(path.join(ROOT, page.script), path.join(jsDir, `${page.assetKey}.js`));
  }
}

async function renderGeneratedContentPages() {
  for (const page of generatedPages) {
    const route = routes.find((entry) => entry.path === page.path);
    if (!route) throw new Error(`Generated page missing route manifest entry: ${page.path}`);
    let html = await readText(page.template);
    html = html.replace("<!--SITE_LANGUAGE_BOOTSTRAP-->", renderLanguageBootstrap());
    if (page.shell?.header) html = html.replace("<!--SITE_STANDARD_HEADER-->", renderStandardHeader(person));
    if (page.shell?.nav) html = html.replace("<!--SITE_STANDARD_NAV-->", renderStandardNav(site, route.nav));
    if (page.shell?.footer) html = html.replace("<!--SITE_STANDARD_FOOTER-->", renderStandardFooter(person, site));
    html = replaceTokens(html, { PERSON_NAME: person.name });
    if (page.path === "/research/") {
      html = html.replace("<!--RESEARCH_JSONLD-->", `<script type="application/ld+json">${escJson(researchPageJsonLd(person))}</script>`);
    }
    const leftovers = [...html.matchAll(/<!--SITE_[A-Z0-9_]+-->/g)].map((m) => m[0]);
    if (leftovers.length) throw new Error(`${page.path}: unresolved site marker(s): ${[...new Set(leftovers)].join(", ")}`);
    const file = routeFile(DIST, page.path);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, html);
  }
}

async function componentTemplate(name, values) {
  return replaceTokens(await readText(`src/components/${name}.html`), values);
}

function personTokenValues() {
  const c = person.currentAppointment;
  return {
    PERSON_NAME: person.name,
    PERSON_EMAIL: person.email,
    PROFILE_IMAGE: person.image,
    GOOGLE_SCHOLAR: person.profiles.googleScholar,
    ORCID: person.profiles.orcid,
    LINKEDIN: person.profiles.linkedin,
    PROFILE_FIELD_EN: person.profile.field.en,
    PROFILE_FIELD_JA: person.profile.field.ja,
    PROFILE_INTRO_1_EN: person.profile.introLine1.en,
    PROFILE_INTRO_1_JA: person.profile.introLine1.ja,
    PROFILE_INTRO_2_EN: person.profile.introLine2.en,
    PROFILE_INTRO_2_JA: person.profile.introLine2.ja,
    CURRENT_ROLE_EN: c.role.en,
    CURRENT_ROLE_JA: c.role.ja,
    CURRENT_SHORT_EN: c.instituteShort.en,
    CURRENT_SHORT_JA: c.instituteShort.ja,
    CURRENT_INSTITUTE_EN: c.institute.en,
    CURRENT_INSTITUTE_JA: c.institute.ja,
    CURRENT_UNIVERSITY_EN: c.university.en,
    CURRENT_UNIVERSITY_JA: c.university.ja,
    CURRENT_PERIOD_EN: c.period.en,
    CURRENT_PERIOD_JA: c.period.ja,
    HOME_AFFIL_DESKTOP_EN: c.homeDesktop.en,
    HOME_AFFIL_DESKTOP_JA: c.homeDesktop.ja,
    HOME_AFFIL_MOBILE_EN: c.homeMobile.en,
    HOME_AFFIL_MOBILE_JA: c.homeMobile.ja,
  };
}

async function renderHome() {
  let html = await readText("src/pages/home.html");
  html = html.replace("<!--HOME_JSONLD-->", `<script type="application/ld+json">${escJson(homeJsonLd(person))}</script>`);
  html = replaceTokens(html, {
    PERSON_NAME: person.name,
    PERSON_EMAIL: person.email,
    LAST_UPDATED_EN: site.lastUpdated.en,
    LAST_UPDATED_JA: site.lastUpdated.ja,
  });

  const affiliation = await componentTemplate("home-affiliation", personTokenValues());
  html = replaceBalancedElement(html, "div", hasClass("affiliation"), affiliation);

  const featured = publications.find((p) => p.slug === site.homeFeaturedPublication);
  if (!featured) throw new Error(`Home featured publication not found: ${site.homeFeaturedPublication}`);
  const homeCitation = featured.presentation?.homeCitation;
  if (!homeCitation) throw new Error(`${featured.slug}: missing presentation.homeCitation`);
  const featuredHtml = await componentTemplate("home-featured-work", {
    FEATURE_SLUG: featured.slug,
    FEATURE_TITLE: featured.title,
    FEATURE_DESKTOP_AUTHORS_HTML: homeCitation.desktopAuthorsHtml,
    FEATURE_MOBILE_AUTHORS_HTML: homeCitation.mobileAuthorsHtml,
    FEATURE_VENUE: featured.venue,
    FEATURE_YEAR: yearOf(featured.publicationDate),
    FEATURE_DOI: featured.doi || "",
  });
  html = replaceBalancedElement(html, "div", hasClass("recent-entry"), featuredHtml);
  await writeFile(path.join(DIST, "index.html"), html);
}

// Profile's Current Research is generated from the visible Ongoing Research
// articles. Do not maintain a second, manually curated project list.
async function renderCurrentResearchLinks() {
  const research = (await readText("src/pages/research.html"))
    .replace(/<!--[\s\S]*?-->/g, ""); // Exclude archived/commented-out articles.
  const section = research.match(/<section\b(?=[^>]*\bid=["']ongoing-research["'])[^>]*>([\s\S]*?)<\/section>/i)?.[1];
  if (!section) throw new Error("Research: ongoing-research section not found");

  const articles = [...section.matchAll(/<article\b[^>]*\bclass=["'][^"']*\bcurrent-project\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi)];
  if (!articles.length) throw new Error("Research: no active Ongoing Research projects found");

  const seenIds = new Set();
  return articles.map(([article]) => {
    const openingTag = article.match(/^<article\b[^>]*>/i)?.[0] || "";
    const id = openingTag.match(/\bid=["']([^"']+)["']/i)?.[1];
    const heading = article.match(/<div\b[^>]*\bclass=["'][^"']*\bcurrent-project-heading\b[^"']*["'][^>]*>[\s\S]*?<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1];
    const titleTag = [...(heading || "").matchAll(/<span\b[^>]*>/gi)]
      .map((match) => match[0])
      .find((tag) => /\bdata-en=/.test(tag) && /\bdata-ja=/.test(tag));
    const en = titleTag?.match(/\bdata-en=["']([^"']+)["']/i)?.[1];
    const ja = titleTag?.match(/\bdata-ja=["']([^"']+)["']/i)?.[1];
    if (!id || !/^[A-Za-z][\w:-]*$/.test(id) || seenIds.has(id) || !en || !ja) {
      throw new Error(`Research: invalid or untranslated Ongoing Research project ${id || "(missing id)"}`);
    }
    seenIds.add(id);
    return `          <li class="current-feature-item">
            <a class="current-feature-link" href="/research/#${encodeURIComponent(id)}">
              <span class="current-feature-title" data-en="${esc(en)}" data-ja="${esc(ja)}">${esc(en)}</span>
              <span class="current-feature-arrow" aria-hidden="true">→</span>
            </a>
          </li>`;
  }).join("\n");
}

async function renderProfile() {
  let html = await readText("src/pages/profile.html");
  html = html
    .replace("<!--PROFILE_JSONLD-->", `<script type="application/ld+json">${escJson(profileJsonLd(person))}</script>`)
    .replace("<!--SITE_STANDARD_HEADER-->", renderStandardHeader(person))
    .replace("<!--SITE_STANDARD_NAV-->", renderStandardNav(site, "profile"))
    .replace("<!--PROFILE_INTRO-->", await componentTemplate("profile-intro", personTokenValues()))
    .replace("<!--CURRENT_APPOINTMENT-->", (await componentTemplate("current-appointment", personTokenValues()))
      .replace("<!--CURRENT_RESEARCH_LINKS-->", await renderCurrentResearchLinks()))
    .replace("<!--SITE_STANDARD_FOOTER-->", renderStandardFooter(person, site));
  html = replaceTokens(html, { PERSON_NAME: person.name });
  const dir = path.join(DIST, "profile");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html);
}

function renderJournalItem(p) {
  const m = p.presentation.journalMetric;
  const metric = m
    ? `<button type="button" class="journal-metric-trigger" data-journal="${esc(m.journal)}" data-quartile="${esc(m.quartile)}" data-jif="${esc(m.jif)}" data-metric-year="${esc(m.metricYear)}" aria-expanded="false"><em>${esc(m.journal)}</em></button><span aria-hidden="true">,</span>`
    : `<em>${esc(p.venue)}</em><span aria-hidden="true">,</span>`;
  const cover = p.presentation.coverBadge ? `<span class="cover-badge">${esc(p.presentation.coverBadge)}</span>` : "";
  const doi = p.doi ? `<a class="pub-doi" href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener noreferrer" aria-label="Open DOI for ${esc(p.title)}"><span class="pub-doi-label">DOI</span><span class="editorial-mark editorial-mark--external" aria-hidden="true"></span></a>` : "";
  return `
        <div class="pub-item" data-publication-slug="${esc(p.slug)}">
          <div class="pub-title">
            <span class="status published" aria-hidden="true">●</span>
            <span class="title-text"><a href="/publications/${esc(p.slug)}/">${esc(p.presentation.indexTitle || p.title)}</a></span>
          </div>
          <div class="pub-meta-block">
            <div class="pub-authors" role="group" aria-label="Authors: ${esc(p.authors.join(", "))}">
              <span class="author-full" aria-hidden="true">${p.presentation.authorsFullHtml}</span>
              <span class="author-short" aria-hidden="true">${p.presentation.authorsShortHtml}</span>
            </div>
            <div class="pub-meta${doi ? " pub-meta--with-doi" : ""}">
              <span class="pub-meta-text">${metric}</span>
              <span class="pub-year">${esc(p.presentation.yearLabel || yearOf(p.publicationDate))}</span>
              ${cover}
              ${doi}
            </div>
          </div>
        </div>`;
}

function renderConferenceItem(p) {
  const full = p.presentation.conferenceNameFullHtml || esc(p.venue);
  const short = p.presentation.conferenceNameShortHtml || full;
  const tooltip = p.presentation.conferenceTooltip ? ` data-tooltip="${esc(p.presentation.conferenceTooltip)}"` : "";
  const status = p.presentation.statusNoteFull
    ? `<span class="pub-status-note" aria-label="Paper presented; proceedings forthcoming"><span class="pub-status-full" data-en="${esc(p.presentation.statusNoteFull)}" data-ja="プロシーディングス刊行予定">${esc(p.presentation.statusNoteFull)}</span><span class="pub-status-short" data-en="${esc(p.presentation.statusNoteShort || p.presentation.statusNoteFull)}" data-ja="刊行予定">${esc(p.presentation.statusNoteShort || p.presentation.statusNoteFull)}</span></span>`
    : "";
  const doi = p.doi ? `<a class="pub-doi" href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener noreferrer" aria-label="Open DOI for ${esc(p.title)}"><span class="pub-doi-label">DOI</span><span class="editorial-mark editorial-mark--external" aria-hidden="true"></span></a>` : "";
  return `
          <div class="pub-item" data-publication-slug="${esc(p.slug)}">
            <div class="pub-title">
              <span class="status published" aria-hidden="true">●</span>
              <span class="title-text"><a href="/publications/${esc(p.slug)}/">${esc(p.presentation.indexTitle || p.title)}</a></span>
            </div>
            <div class="pub-meta-block">
              <div class="pub-authors" role="group" aria-label="Authors: ${esc(p.authors.join(", "))}">
                <span class="author-full" aria-hidden="true">${p.presentation.authorsFullHtml}</span>
                <span class="author-short" aria-hidden="true">${p.presentation.authorsShortHtml}</span>
              </div>
              <div class="pub-meta${doi ? " pub-meta--with-doi" : ""}">
                <span class="pub-meta-text meta-tooltip"${tooltip}><span class="conference-name-full">${full}</span><span class="conference-name-short">${short}</span>,</span>
                <span class="pub-year">${esc(p.presentation.yearLabel || yearOf(p.publicationDate))}</span>
                ${status}
                ${doi}
              </div>
            </div>
          </div>`;
}

async function renderPublicationsIndex() {
  const template = await readText("src/templates/publications-index.html");
  const journals = publications.filter((p) => p.kind === "journal");
  const conferences = publications.filter((p) => p.kind === "conference");
  let html = template
    .replace("<!--SITE_STANDARD_HEADER-->", renderStandardHeader(person))
    .replace("<!--SITE_STANDARD_NAV-->", renderStandardNav(site, "publications"))
    .replace("<!--SITE_STANDARD_FOOTER-->", renderStandardFooter(person, site))
    .replace("<!--P2_JOURNAL_ITEMS-->", journals.map(renderJournalItem).join("\n"))
    .replace("<!--P2_CONFERENCE_ITEMS-->", conferences.map(renderConferenceItem).join("\n"))
    .replace("__P2_JOURNAL_COUNT__", String(journals.length))
    .replace("__P2_CONFERENCE_COUNT__", String(conferences.length));
  html = replaceTokens(html, { PERSON_NAME: person.name });
  html = html.replace("</head>", `  <script type="application/ld+json">${escJson(publicationsIndexJsonLd(person, publications))}</script>\n</head>`);
  const dir = path.join(DIST, "publications");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html);
}

function addPaperFigureAnchors(figuresHtml) {
  const segments = [];
  let counter = 0;
  const html = figuresHtml.replace(/<div\s+class="(section-title(?:\s+[^"]+)?)"([^>]*)>(\s*<strong>([^<]+)<\/strong>)/gi,
    (match, className, attrs, opening, title) => {
      const label = title.trim();
      const id = `paper-section-${++counter}`;
      segments.push({ id, label: /ITTC Hull Roughness Timeline/i.test(label) ? "ITTC timeline" : label });
      return `<div class="${className}" id="${id}"${attrs}>${opening}`;
    });
  return { html, segments };
}

function renderPaperMarginNav(sections) {
  // Link to existing content anchors only. Visual rail stays outside the document flow.
  const links = sections.map(({ id, label }, index) =>
    `<li><a class="paper-margin-nav__link" href="#${id}"${index === 0 ? ' aria-current="location"' : ''}>${esc(label)}</a></li>`
  ).join("\n      ");
  return `<nav class="paper-margin-nav" aria-label="On this paper">
    <div class="paper-margin-nav__label">On this page</div>
    <ol class="paper-margin-nav__list">${links}</ol>
  </nav>`;
}

async function renderPublicationDetail(p) {
  const base = path.join(ROOT, "src/publications", p.slug);
  const [authorsHtml, affilsHtml, abstractHtml, afterAbstractHtml, pubMetaHtml, figuresHtml, css] = await Promise.all([
    readFile(path.join(base, "authors.html"), "utf8"),
    readFile(path.join(base, "affiliations.html"), "utf8"),
    readFile(path.join(base, "abstract.html"), "utf8"),
    readFile(path.join(base, "after-abstract.html"), "utf8"),
    readFile(path.join(base, "publication-meta.html"), "utf8"),
    readFile(path.join(base, "figures.html"), "utf8"),
    readFile(path.join(base, "page.css"), "utf8"),
  ]);
  const figureSections = addPaperFigureAnchors(figuresHtml);
  const abstractLabel = /<h2[^>]*>\s*Summary\s*<\/h2>/i.test(abstractHtml) ? "Summary" : "Abstract";
  const paperNav = renderPaperMarginNav([
    {id: "paper-overview", label: "Overview"},
    {id: "paper-abstract", label: abstractLabel},
    {id: "paper-publication", label: "Publication"},
    ...figureSections.segments,
  ]);
  const canonical = `${SITE}/publications/${p.slug}/`;
  const route = routes.find((entry) => entry.path === `/publications/${p.slug}/`);
  if (!route) throw new Error(`Publication route missing from manifest: ${p.slug}`);
  // Public scholarly records remain distinct from their publisher-hosted articles.
  // All figures keep noimageindex regardless of HTML indexability.
  const robots = route.index ? "index, follow, noimageindex" : "noindex, follow, noimageindex";
  const bingRobots = route.index ? "index, follow, max-image-preview:none" : "noindex, follow, max-image-preview:none";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="${robots}">
  <meta name="bingbot" content="${bingRobots}">
  <title>${esc(p.title)} | ${esc(person.name)}</title>
  <meta name="author" content="${esc(person.name)}">
  <meta name="description" content="${esc(p.description)}">
  <link rel="canonical" href="${canonical}">
  <script type="application/ld+json">${escJson(publicationPageJsonLd(person, p, canonical))}</script>
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <meta property="og:title" content="${esc(p.title)} | ${esc(person.name)}">
  <meta property="og:description" content="${esc(p.ogDescription)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="${esc(person.name)} — Publications">
  <meta property="og:image" content="${SITE}/assets/thumbnail.png">
  <script src="/assets/js/site-analytics.js?v=1"></script>
  <link rel="stylesheet" href="/assets/css/site-shell.css?v=1">
  <style>\n${css}\n  </style>
  <link rel="stylesheet" href="/assets/css/paper-margin-nav.css?v=4.3">
  <script defer src="/assets/js/paper-margin-nav.js?v=4.3"></script>
</head>
<body id="top">
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5MMRV373" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <nav class="top-back" aria-label="Back navigation"><span class="editorial-mark editorial-mark--back" aria-hidden="true"></span> <a href="/publications/">Back to Publications</a></nav>
  ${paperNav}
  <main id="main-content" tabindex="-1">
    <h1 id="paper-overview">${esc(p.title)}</h1>
    <div class="meta">${p.detailMetaHtml}</div>
    <div class="authors">${authorsHtml}</div>
    <div class="affils">${affilsHtml}</div>
    <div class="abstract" id="paper-abstract">${abstractHtml}</div>
    ${afterAbstractHtml}
    <div class="pub-meta" id="paper-publication">${pubMetaHtml}</div>
    ${figureSections.html}
  </main>
  ${renderStandardFooter(person, site)}
</body>
</html>\n`;
  const dir = path.join(DIST, "publications", p.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html);
}

async function writeRobotsAndSitemap() {
  const robots = `User-agent: *\nAllow: /\n\nUser-agent: Googlebot-Image\nAllow: /assets/etc/profile-portrait.png\nDisallow: /assets/archive/\nDisallow: /assets/etc/\nDisallow: /assets/log/\nDisallow: /assets/publications/\nDisallow: /assets/research/\n\nSitemap: ${SITE}/sitemap.xml\n`;
  await writeFile(path.join(DIST, "robots.txt"), robots);
  const urls = routes.filter((r) => r.index).map((r) => `${SITE}${r.path}`);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
  await writeFile(path.join(DIST, "sitemap.xml"), sitemap);
}

await copyStaticFiles();
await renderHome();
await renderProfile();
await copyGeneratedPageAssets();
await renderGeneratedContentPages();
await renderPublicationsIndex();
for (const publication of publications) await renderPublicationDetail(publication);
// The shared palette is the final stylesheet on every page. Keeping it
// after page-specific styles prevents scattered color overrides and matches
// the reviewed Home/Publications color-study cascade exactly.
async function appendPaletteStylesheet() {
  const paths = [ ...routes.map((route) => route.path), "/404.html" ];
  const tag = [
    '  <link rel="stylesheet" href="/assets/css/cool-academic.css?v=1">',
    '  <link rel="stylesheet" href="/assets/css/component-refinement.css?v=4">',
    '  <link rel="stylesheet" href="/assets/css/editorial-link-marks.css?v=7.3">',
    '  <link rel="stylesheet" href="/assets/css/desktop-refinements.css?v=7.2">',
    '  <link rel="stylesheet" href="/assets/css/reading-interactions-v4.css?v=4.3">',
    '  <script defer src="/assets/js/reading-interactions-v4.js?v=7.5"></script>',
  ].join('\n');
  for (const route of paths) {
    const file = route === "/404.html" ? path.join(DIST, "404.html") : routeFile(DIST, route);
    let html = await readFile(file, "utf8");
    if (!html.includes("</head>")) throw new Error(`${route}: no closing head for palette inclusion`);
    if (html.includes("cool-academic.css") || html.includes("component-refinement.css") || html.includes("editorial-link-marks.css") || html.includes("desktop-type-tuning.css") || html.includes("desktop-visual-refinement.css") || html.includes("desktop-refinements.css")) {
      throw new Error(`${route}: duplicate color/component stylesheet inclusion`);
    }
    html = html.replace("</head>", `${tag}\n</head>`);
    await writeFile(file, html);
  }
}
await appendPaletteStylesheet();

await writeRobotsAndSitemap();

const generated = routes.filter((r) => r.source.startsWith("generated")).length;
const contentGenerated = routes.filter((r) => r.source === "generated-content-page").length;
console.log(`Built ${routes.length} authored routes into dist/; all ${generated} routes are source-generated (${contentGenerated} content pages plus Home/Profile/Publications). No legacy HTML deployment sources remain.`);
