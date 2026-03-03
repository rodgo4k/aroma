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

/**
 * GET /api/admin/users - Lista usuários (apenas admin).
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const payload = await requireAdmin(req, res);
  if (!payload) return;

  try {
    let rows;
    try {
      rows = await sql`
        SELECT id, email, name, phone, role, created_at, updated_at, last_activity_at
        FROM users ORDER BY created_at DESC
      `;
    } catch (schemaErr) {
      if (schemaErr?.code !== "42703") throw schemaErr;
      rows = await sql`
        SELECT id, email, name, phone, role, created_at, updated_at
        FROM users ORDER BY created_at DESC
      `;
    }
    const list = (rows || []).map((u) => ({
      id: u.id,
      email: u.email ?? null,
      phone: u.phone ?? null,
      name: u.name ?? null,
      role: u.role ?? "user",
      created_at: u.created_at,
      updated_at: u.updated_at ?? u.created_at,
      last_activity_at: u.last_activity_at ?? u.updated_at ?? u.created_at,
    }));
    return res.status(200).json(list);
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return res.status(500).json({ error: "Erro ao listar usuários" });
  }
}
