/**
 * Optional READ-ONLY verification of DOI registration metadata via Crossref.
 * This does not run during `npm run build` and NEVER modifies canonical records.
 * Network-dependent results are presented as review signals, not automatic truth.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pubs = JSON.parse(await readFile(path.join(ROOT, 'src/content/publications.json'), 'utf8'));
const normalize = (value = '') => String(value).replace(/<[^>]*>/g, ' ').normalize('NFKD')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase();
const mismatches = [], unavailable = [], checked = [];
for (const p of pubs.filter(x => x.doi)) {
  let response;
  try {
    response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(p.doi)}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'HanScholarlySiteMetadataAudit/1.0 (read-only; manual review)' },
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    unavailable.push(`${p.slug}: ${error.message}`);
    continue;
  }
  if (!response.ok) {
    unavailable.push(`${p.slug}: Crossref HTTP ${response.status} (not all DOIs are in Crossref)`);
    continue;
  }
  const data = (await response.json()).message || {};
  checked.push(p.slug);
  const registeredTitle = data.title?.[0] || '';
  if (registeredTitle && normalize(registeredTitle) !== normalize(p.title)) {
    mismatches.push(`${p.slug}: title differs (site: ${p.title} | registry: ${registeredTitle})`);
  }
  const registryAuthors = data.author || [];
  if (registryAuthors.length && registryAuthors.length !== p.authors.length) {
    mismatches.push(`${p.slug}: author count differs (site ${p.authors.length}, registry ${registryAuthors.length})`);
  }
  for (let i = 0; i < Math.min(registryAuthors.length, p.authors.length); i++) {
    const surname = normalize(registryAuthors[i].family);
    if (surname && !normalize(p.authors[i]).split(' ').includes(surname)) {
      mismatches.push(`${p.slug}: author ${i+1} surname differs (site ${p.authors[i]}, registry ${registryAuthors[i].family})`);
    }
  }
  // Publisher-deposited print vs online dates can differ. Do not overwrite author dates.
}
console.log(`Publisher metadata checked: ${checked.length}/${pubs.filter(p => p.doi).length} DOI records.`);
if (unavailable.length) {
  console.log('Not checked (manual review if needed):');
  for (const note of unavailable) console.log(' -', note);
}
if (mismatches.length) {
  console.log('Differences requiring human review — canonical data NOT changed:');
  for (const note of mismatches) console.log(' -', note);
  process.exitCode = 1;
} else if (checked.length) {
  console.log('No differences found in the compared title/author fields. Publication dates and licensing are NOT verified by this check.');
}
if (!checked.length) process.exitCode = 2;
