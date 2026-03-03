import { sql } from "../../../lib/db.js";
import { getBearerToken, verifyToken } from "../../../lib/auth.js";

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

/**
 * GET /api/admin/users/:id - Detalhe do usuário
 * POST /api/admin/users/:id/make-admin - Tornar usuário admin
 */
export default async function handler(req, res) {
  const id = req.query?.id;
  if (!id) {
    return res.status(400).json({ error: "ID do usuário é obrigatório" });
  }

  if (req.method === "GET") {
    const payload = await requireAdmin(req, res);
    if (!payload) return;

    try {
      let rows;
      try {
        rows = await sql`
          SELECT id, email, name, avatar_url, birth_date, city, state, country,
                 phone, role, created_at, updated_at, last_activity_at
          FROM users WHERE id = ${id}
        `;
      } catch (schemaErr) {
        if (schemaErr?.code !== "42703") throw schemaErr;
        rows = await sql`
          SELECT id, email, name, created_at, updated_at
          FROM users WHERE id = ${id}
        `;
        if (rows.length > 0) {
          rows[0].avatar_url = null;
          rows[0].birth_date = null;
          rows[0].city = null;
          rows[0].state = null;
          rows[0].country = null;
          rows[0].phone = null;
          rows[0].role = "user";
          rows[0].last_activity_at = rows[0].updated_at;
        }
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      const u = rows[0];
      return res.status(200).json({
        user: {
          id: u.id,
          email: u.email ?? null,
          name: u.name ?? null,
          avatar_url: u.avatar_url ?? null,
          birth_date: u.birth_date ?? null,
          city: u.city ?? null,
          state: u.state ?? null,
          country: u.country ?? null,
          phone: u.phone ?? null,
          role: u.role ?? "user",
          created_at: u.created_at,
          updated_at: u.updated_at ?? u.created_at,
          last_activity_at: u.last_activity_at ?? u.updated_at ?? u.created_at,
        },
      });
    } catch (err) {
      console.error("GET /api/admin/users/:id error:", err);
      return res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  }

  if (req.method === "POST") {
    const payload = await requireAdmin(req, res);
    if (!payload) return;

    try {
      const [current] = await sql`
        SELECT id, role FROM users WHERE id = ${id}
      `;
      if (!current) return res.status(404).json({ error: "Usuário não encontrado" });
      const currentRole = (current.role || "user").toString().toLowerCase();
      if (currentRole === "admin") {
        return res.status(200).json({ ok: true, id, role: "admin", changed: false });
      }
      await sql`
        UPDATE users
        SET role = 'admin', updated_at = now()
        WHERE id = ${id}
      `;
      return res.status(200).json({ ok: true, id, role: "admin", changed: true });
    } catch (err) {
      console.error("POST /api/admin/users/:id/make-admin error:", err);
      return res.status(500).json({ error: "Erro ao tornar usuário administrador" });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}
