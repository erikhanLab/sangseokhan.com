// Build-time scholarly identities from the existing canonical publication record.
// A portfolio summary is a WebPage ABOUT a paper, not an independently published paper.
export function publicationPageJsonLd(person, publication, canonical) {
  const paper = publication;
  const doiUrl = paper.doi ? `https://doi.org/${paper.doi}` : null;
  const paperId = doiUrl ? `${doiUrl}#article` : `${canonical}#scholarly-work`;
  const author = paper.authors.map((name) => name === person.scholarlyName
    ? {
        "@type": "Person",
        "@id": `${person.site}/#person`,
        name,
        alternateName: person.name,
        sameAs: [person.profiles.orcid, person.profiles.googleScholar],
      }
    : { "@type": "Person", name });
  const bib = paper.bibliography ?? {};
  // Conference presentation is NOT interchangeable with a publication date.
  const publicationDate = bib.publishedDate || null;
  const work = {
    "@type": "ScholarlyArticle",
    "@id": paperId,
    name: paper.title,
    author,
    description: paper.description,
    isPartOf: {
      "@type": paper.kind === "journal" ? "Periodical" : "CreativeWork",
      name: paper.venue,
    },
    // Unknown publisher access status must not be turned into a factual "not free" claim.
    ...(paper.openAccess === true ? { isAccessibleForFree: true } : {}),
    ...(publicationDate ? { datePublished: publicationDate } : {}),
    ...(doiUrl ? {
      url: doiUrl,
      sameAs: doiUrl,
      identifier: { "@type": "PropertyValue", propertyID: "DOI", value: paper.doi, url: doiUrl },
    } : {}),
    ...(bib.license === "CC BY 4.0" ? { license: "https://creativecommons.org/licenses/by/4.0/" } : {}),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: paper.title,
        description: paper.description,
        inLanguage: "en",
        isPartOf: { "@id": `${person.site}/#website` },
        mainEntity: { "@id": paperId },
        ...(doiUrl ? { citation: doiUrl } : {}),
      },
      work,
    ],
  };
}

export function publicationsIndexJsonLd(person, publications) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${person.site}/publications/#webpage`,
    url: `${person.site}/publications/`,
    name: `Publications | ${person.name}`,
    inLanguage: "en",
    isPartOf: { "@id": `${person.site}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: publications.length,
      itemListElement: publications.map((paper, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: paper.title,
        url: `${person.site}/publications/${paper.slug}/`,
      })),
    },
  };
}

export function researchPageJsonLd(person) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${person.site}/research/#webpage`,
    url: `${person.site}/research/`,
    name: `Research | ${person.name}`,
    inLanguage: "en",
    isPartOf: { "@id": `${person.site}/#website` },
    author: { "@id": `${person.site}/#person` },
    about: person.knowsAbout.map((name) => ({ "@type": "Thing", name })),
  };
}
