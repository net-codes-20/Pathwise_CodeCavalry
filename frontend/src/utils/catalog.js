import rawCatalog from "../data/catalog.json";

export function getAllCatalogResources() {
  return rawCatalog || [];
}

export function searchCatalog({ query = "", type = "all", level = "all", domain = "all" } = {}) {
  let results = rawCatalog || [];

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter((item) => {
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchDomain = item.domain?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTags || matchDomain;
    });
  }

  if (type && type !== "all") {
    results = results.filter((item) => item.type?.toLowerCase() === type.toLowerCase());
  }

  if (level && level !== "all") {
    results = results.filter((item) => item.level?.toLowerCase() === level.toLowerCase());
  }

  if (domain && domain !== "all") {
    results = results.filter((item) => item.domain?.toLowerCase() === domain.toLowerCase());
  }

  return results;
}

export function getResourceById(id) {
  if (!id) return null;
  return (rawCatalog || []).find((r) => r.id === id) || null;
}
