import { sql } from "../../lib/db.js";
import { getBearerToken, verifyToken } from "../../lib/auth.js";

async function requireAdmin(req, res) {
  const token = getBearerToken(req);
  const payload = verifyToken(token);
  if (!payload?.userId) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return null;
  }
  if (!sql) {
    res.status(503).json({ error: "Banco de dados não configurado" });
    return null;
  }
  const rows = await sql`SELECT role FROM users WHERE id = ${payload.userId}`;
  const user = rows?.[0];
  if (!user) {
    res.status(403).json({ error: "Usuário não encontrado" });
    return null;
  }
  const role = (user.role || "user").toString().toLowerCase();
  if (role !== "admin") {
    res.status(403).json({ error: "Acesso negado. Apenas administradores." });
    return null;
  }
  return payload;
}

export default async function handler(req, res) {
  const id = req.query?.id;
  if (!id) {
    return res.status(400).json({ error: "ID é obrigatório" });
  }

  if (req.method !== "GET" && req.method !== "PUT" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  if (!sql) {
    return res.status(503).json({ error: "Banco de dados não configurado" });
  }

  try {
    if (req.method === "GET") {
      let p;
      try {
        [p] = await sql`
          SELECT id, external_url, title, description, catalog_source, notes, variants, image_2_url, ativo, esgotado
          FROM perfumes WHERE id = ${id}
        `;
      } catch (queryErr) {
        if (queryErr?.code !== "42703") throw queryErr;
        [p] = await sql`
          SELECT id, external_url, title, description, catalog_source, notes, variants, image_2_url
          FROM perfumes WHERE id = ${id}
        `;
      }
      if (!p) return res.status(404).json({ error: "Perfume não encontrado" });
      const isActive = p.ativo === true || p.ativo == null;
      if (!isActive) {
        const payload = await requireAdmin(req, res);
        if (!payload) return res.status(404).json({ error: "Perfume não encontrado" });
      }
      const imgRows = await sql`
        SELECT url, position FROM perfume_images WHERE perfume_id = ${id} ORDER BY position
      `;
      let images = (imgRows || []).map((i) => (i.url != null ? String(i.url).trim() : "")).filter(Boolean);
      if (images.length === 0) {
        const vars = p.variants ?? [];
        const firstWithImg = vars.find((v) => v && (v.image_url || v.imageUrl));
        const url = firstWithImg && (firstWithImg.image_url ?? firstWithImg.imageUrl);
        if (url) images = [String(url).startsWith("//") ? "https:" + url : url];
      }
      if (images.length === 0 && p.image_2_url) {
        const u = String(p.image_2_url).trim();
        if (u) images = [u.startsWith("//") ? "https:" + u : u];
      }
      return res.status(200).json({
        id: p.id,
        url: p.external_url,
        title: p.title,
        description: p.description ?? "",
        catalogSource: p.catalog_source,
        notes: p.notes ?? {},
        variants: p.variants ?? [],
        images,
        ativo: p.ativo === true || p.ativo == null,
        esgotado: p.esgotado === true,
      });
    }

    if (req.method === "PUT") {
      const payload = await requireAdmin(req, res);
      if (!payload) return;
      const [existing] = await sql`SELECT id FROM perfumes WHERE id = ${id}`;
      if (!existing) return res.status(404).json({ error: "Perfume não encontrado" });
      const body = req.body || {};
      const title = typeof body.title === "string" ? body.title.trim() : "";
      let externalUrl = typeof body.external_url === "string" ? body.external_url.trim() : (typeof body.url === "string" ? body.url.trim() : "");
      const catalogSource = typeof body.catalog_source === "string" ? body.catalog_source.trim() : "";
      if (!title) return res.status(400).json({ error: "Título é obrigatório" });
      if (!externalUrl) externalUrl = null;
      if (!["arabe", "feminino", "normal"].includes(catalogSource)) {
        return res.status(400).json({ error: "Catálogo deve ser: arabe, feminino ou normal" });
      }
      const description = typeof body.description === "string" ? body.description.trim() || null : null;
      const notes = body.notes && typeof body.notes === "object" ? body.notes : {};
      const variants = Array.isArray(body.variants) ? body.variants : [];
      const rawImagesPut = Array.isArray(body.images) ? body.images : [];
      const images = rawImagesPut.map((u) => (typeof u === "string" ? u.trim() : "")).filter(Boolean);
      const ativo = body.ativo !== false && body.ativo !== "false";
      const esgotado = body.esgotado === true || body.esgotado === "true";

      await sql`
        UPDATE perfumes
        SET external_url = ${externalUrl}, title = ${title}, description = ${description}, catalog_source = ${catalogSource}, notes = ${JSON.stringify(notes)}, variants = ${JSON.stringify(variants)}, ativo = ${ativo}, esgotado = ${esgotado}, updated_at = now()
        WHERE id = ${id}
      `;
      await sql`DELETE FROM perfume_images WHERE perfume_id = ${id}`;
      for (let i = 0; i < images.length; i++) {
        await sql`INSERT INTO perfume_images (perfume_id, url, position) VALUES (${id}, ${images[i]}, ${i})`;
      }
      const [p] = await sql`SELECT id, external_url, title, description, catalog_source, notes, variants, ativo, esgotado FROM perfumes WHERE id = ${id}`;
      const imgRows = await sql`SELECT url, position FROM perfume_images WHERE perfume_id = ${id} ORDER BY position`;
      const imagesList = (imgRows || []).map((i) => (i.url != null ? String(i.url).trim() : "")).filter(Boolean);
      return res.status(200).json({
        id: p.id,
        url: p.external_url,
        title: p.title,
        description: p.description ?? "",
        catalogSource: p.catalog_source,
        notes: p.notes ?? {},
        variants: p.variants ?? [],
        images: imagesList,
        ativo: p.ativo !== false,
        esgotado: p.esgotado === true,
      });
    }

    if (req.method === "DELETE") {
      const payload = await requireAdmin(req, res);
      if (!payload) return;
      const [existing] = await sql`SELECT id FROM perfumes WHERE id = ${id}`;
      if (!existing) return res.status(404).json({ error: "Perfume não encontrado" });
      await sql`DELETE FROM perfume_images WHERE perfume_id = ${id}`;
      await sql`DELETE FROM perfumes WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    if (err?.code === "23505") return res.status(409).json({ error: "Já existe um perfume com esta URL externa" });
    console.error("API perfumes [id] error:", err);
    return res.status(500).json({ error: "Erro ao processar perfume" });
  }
}
