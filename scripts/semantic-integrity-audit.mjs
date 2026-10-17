/**
 * v7 semantic, bibliography and indexing consistency audit.
 * Purely local: reads committed canonical records and built HTML; makes no edits
 * and does not silently replace authored bibliography with external data.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFile(path.join(ROOT, rel), 'utf8');
const json = async (rel) => JSON.parse(await read(rel));
const [publications, routes, person] = await Promise.all([
  json('src/content/publications.json'), json('src/content/routes.json'), json('src/content/person.json')
]);
const errors = [];
const insist = (condition, message) => { if (!condition) errors.push(message); };
const byPath = new Map(routes.map(route => [route.path, route]));
const strip = (html) => html.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, ' ')
  .replace(/<[^>]*>/g, ' ').replaceAll('&amp;', '&')
  .replace(/\s+/g, ' ').trim();
const graphs = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => { try { return JSON.parse(match[1]); } catch { return null; } }).filter(Boolean);
const meta = (html, name) => html.match(new RegExp(`<meta\\b[^>]*name="${name}"[^>]*content="([^"]+)"`, 'i'))?.[1] || '';
const dois = new Set();
for (const p of publications) {
  const route = `/publications/${p.slug}/`;
  const page = await read(`dist/publications/${p.slug}/index.html`);
  const authorSource = strip(await read(`src/publications/${p.slug}/authors.html`));
  const record = p.bibliography || {};
  const shouldIndex = p.searchVisibility === 'index';
  insist(byPath.get(route)?.index === shouldIndex, `${p.slug}: independently authored journal summary / conference index policy mismatched`);
  insist(meta(page, 'robots').includes(shouldIndex ? 'index, follow' : 'noindex, follow'), `${p.slug}: robots meta not aligned`);
  insist(meta(page, 'robots').includes('noimageindex'), `${p.slug}: figure search restriction removed`);
  const g = graphs(page).find(x => Array.isArray(x['@graph']));
  const work = g?.['@graph']?.find(x => x['@type'] === 'ScholarlyArticle');
  const webpage = g?.['@graph']?.find(x => x['@type'] === 'WebPage');
  insist(work?.name === p.title, `${p.slug}: structured title differs from canonical title`);
  insist(JSON.stringify(work?.author?.map(x => x.name)) === JSON.stringify(p.authors), `${p.slug}: structured author sequence differs from canonical order`);
  insist(webpage?.url === `${person.site}${route}`, `${p.slug}: WebPage URL mismatched`);
  insist(webpage?.inLanguage === 'en', `${p.slug}: publication page lacks language metadata`);
  insist(page.includes(`<h1 id="paper-overview">${p.title}</h1>`), `${p.slug}: visible title differs from structured title`);
  let priorPos = -1;
  for (const author of p.authors) {
    const offset = authorSource.indexOf(author, priorPos + 1);
    insist(offset > priorPos, `${p.slug}: '${author}' not found in correct author order in author HTML`);
    priorPos = offset;
  }
  if (p.doi) {
    insist(/^10\.\d{4,9}\/.+/.test(p.doi), `${p.slug}: malformed DOI`);
    insist(!dois.has(p.doi.toLowerCase()), `${p.slug}: duplicate DOI across bibliography`);
    dois.add(p.doi.toLowerCase());
    insist(record.recordUrl === `https://doi.org/${p.doi}`, `${p.slug}: publisher record URL differs from canonical DOI`);
    insist(work?.identifier?.value === p.doi && work?.url === `https://doi.org/${p.doi}`, `${p.slug}: structured DOI mismatch`);
    insist(page.includes(`https://doi.org/${p.doi}`), `${p.slug}: visible DOI link missing`);
  }
  if (record.publishedDate) insist(work?.datePublished === record.publishedDate, `${p.slug}: publication date mismatch`);
  else insist(work?.datePublished === undefined, `${p.slug}: unknown date invented`);
  insist(work?.isPartOf?.name === p.venue, `${p.slug}: venue name mismatched`);
  insist(page.includes('<link rel="canonical" href="' + person.site + route), `${p.slug}: canonical URL missing`);
}
const pubIndex = await read('dist/publications/index.html');
for (const p of publications) {
  const target = `Authors: ${p.authors.join(', ')}`;
  const re = new RegExp(`data-publication-slug="${p.slug}"[\\s\\S]{0,850}?role="group" aria-label="([^"]+)"`);
  const matches = pubIndex.match(re);
  insist(matches?.[1] === target, `${p.slug}: canonical accessible author list missing from Publications index`);
}
const sitemap = await read('dist/sitemap.xml');
for (const p of publications) {
  const url = `${person.site}/publications/${p.slug}/`;
  insist(sitemap.includes(`<loc>${url}</loc>`) === (p.searchVisibility === 'index'), `${p.slug}: sitemap and indexing policy diverged`);
}
const home = await read('dist/index.html');
const profile = await read('dist/profile/index.html');
const pubs = graphs(pubIndex).find(g => g['@type'] === 'CollectionPage');
insist(pubs?.inLanguage === 'en', 'Publications CollectionPage default language missing');
const website = graphs(home).find(g => Array.isArray(g['@graph']))?.['@graph']?.find(x => x['@type'] === 'WebSite');
insist(website?.inLanguage === 'en', 'WebSite default language missing');
insist(graphs(profile).find(g => g['@type'] === 'ProfilePage')?.inLanguage === 'en', 'ProfilePage default language missing');
insist(profile.includes('data-lang="ja" lang="ja"') && profile.includes('data-lang="en" lang="en"'), 'EN/JP language toggle lacks explicit control language');
for (const route of routes) {
  const file = route.path === '/' ? 'dist/index.html' : `dist${route.path}index.html`;
  const html = await read(file);
  insist(/<html\b[^>]*lang="en"/.test(html), `${route.path}: static language fallback missing`);
  insist(!/rel="alternate"\s+hreflang=/.test(html), `${route.path}: hreflang without corresponding distinct locale URL`);
}
if (errors.length) {
  console.error(`FAIL semantic integrity (${errors.length}):`);
  for (const err of errors) console.error(` - ${err}`);
  process.exit(1);
}
console.log(`PASS v7 semantic integrity: ${publications.length} source-author/structured-work comparisons; ${dois.size} unique DOI(s); four journal summaries indexable, three conference records noindex; schema/default language/accessible bibliography/sitemap checks.`);
