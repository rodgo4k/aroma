const BASE = import.meta.env.VITE_API_URL || "";
const BLOB_HOST = "blob.vercel-storage.com";

function toProxyUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return imageUrl;
  if (!imageUrl.includes(BLOB_HOST)) return imageUrl;
  const base = BASE.replace(/\/$/, "");
  return `${base}/api/perfume-image?url=${encodeURIComponent(imageUrl)}`;
}

function applyImageProxy(perfume) {
  if (!perfume) return perfume;
  const p = { ...perfume };
  if (Array.isArray(p.images)) p.images = p.images.map(toProxyUrl);
  if (Array.isArray(p.variants)) {
    p.variants = p.variants.map((v) => {
      if (!v) return v;
      const url = v.image_url ?? v.imageUrl;
      if (!url) return v;
      const proxied = toProxyUrl(url);
      return { ...v, image_url: proxied, imageUrl: proxied };
    });
  }
  return p;
}

/**
 * Lista perfumes do banco. Opcional: ?catalog=arabe|feminino|normal
 * Imagens do Blob são convertidas para o proxy do backend (evita 403).
 * @param {{ catalog?: string }} [params]
 * @returns {Promise<Array<{ id: string, url: string, title: string, description: string, catalogSource: string, notes: object, variants: array, images: string[] }>>}
 */
export async function getPerfumesList(params = {}) {
  const base = BASE.replace(/\/$/, "");
  const apiBase = base ? base : (typeof window !== "undefined" ? window.location.origin : "");
  const url = new URL(`${apiBase}/api/perfumes`, apiBase || undefined);
  if (params.catalog && ["arabe", "feminino", "normal"].includes(params.catalog)) {
    url.searchParams.set("catalog", params.catalog);
  }
  const res = await fetch(url.toString());
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const msg = data?.error || (res.status === 503 ? "Banco não configurado." : "Erro ao carregar catálogo.");
    throw new Error(msg);
  }
  const list = data ?? [];
  return list.map(applyImageProxy);
}

/**
 * Busca um perfume por id.
 * Imagens do Blob são convertidas para o proxy do backend (evita 403).
 * @param {string} id - UUID do perfume
 * @returns {Promise<{ id: string, url: string, title: string, description: string, catalogSource: string, notes: object, variants: array, images: string[] }>}
 */
export async function getPerfumeById(id) {
  const base = BASE.replace(/\/$/, "");
  const apiBase = base || (typeof window !== "undefined" ? window.location.origin : "");
  const res = await fetch(`${apiBase}/api/perfumes/${encodeURIComponent(id)}`);
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    if (res.status === 404) throw new Error("Perfume não encontrado.");
    throw new Error(data?.error || "Erro ao carregar perfume.");
  }
  return applyImageProxy(data);
}
