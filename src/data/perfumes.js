export const CATALOG_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "arabe", label: "Árabe" },
  { value: "feminino", label: "Feminino" },
  { value: "normal", label: "Masculino / Unissex" },
];

/**
 * Extrai dados para exibição e filtro de um item do catálogo (API ou objeto com mesma forma).
 * @param {Object} item - Item com url, title, description, images[], notes, variants[].
 * @returns {{ imageUrl: string, title: string, priceMin: number, priceShort: string, url: string, catalogSource: string, catalogLabel: string, description: string, notes: Object }}
 */
export function getPerfumeDisplayData(item) {
  const variants = item.variants || [];
  const withPrice = variants.filter((v) => v.price_number != null);
  const priceMin = withPrice.length ? Math.min(...withPrice.map((v) => v.price_number)) : null;
  const firstVariant = variants.find((v) => v.image_url) || variants[0];
  const variantImage = firstVariant?.image_url
    ? (String(firstVariant.image_url).startsWith("//") ? "https:" + firstVariant.image_url : firstVariant.image_url)
    : "";
  const mainImage = item.images && item.images[0]
    ? (String(item.images[0]).startsWith("//") ? "https:" + item.images[0] : item.images[0])
    : "";
  const imageUrl = mainImage || variantImage || "";
  const priceShort = firstVariant?.price_short || (priceMin != null ? `R$ ${priceMin.toFixed(2).replace(".", ",")}` : "");
  const source = item.catalogSource || "normal";
  const labels = { arabe: "Árabe", feminino: "Feminino", normal: "Masculino / Unissex" };
  return {
    imageUrl,
    title: item.title || "",
    priceMin: priceMin ?? 0,
    priceShort,
    url: item.url || "#",
    catalogSource: source,
    catalogLabel: labels[source] || source,
    description: item.description || "",
    notes: item.notes || {},
  };
}

/**
 * Lista todas as URLs de imagem do perfume (item.images + variants[].image_url, únicas).
 * @param {Object} item - Item com images[] e variants[] (API ou JSON).
 * @returns {string[]}
 */
export function getPerfumeAllImages(item) {
  const seen = new Set();
  const out = [];
  const add = (url) => {
    if (!url || typeof url !== "string") return;
    const full = String(url).startsWith("//") ? "https:" + url : url;
    if (seen.has(full)) return;
    seen.add(full);
    out.push(full);
  };
  (item.images || []).forEach(add);
  (item.variants || []).forEach((v) => add(v?.image_url));
  return out;
}
