import { sql } from "../lib/db.js";
import { getBearerToken, verifyToken } from "../lib/auth.js";

/**
 * GET /api/admin-check
 * Confirma no servidor (banco) se o usuário autenticado é admin.
 * Retorna 403 se não for admin. Usado pela página do painel para evitar
 * acesso baseado apenas em estado do cliente.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const token = getBearerToken(req);
  const payload = verifyToken(token);
  if (!payload?.userId) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }

  if (!sql) {
    return res.status(503).json({ error: "Banco de dados não configurado" });
  }

  try {
    let rows;
    try {
      rows = await sql`
        SELECT role FROM users WHERE id = ${payload.userId}
      `;
    } catch (e) {
      console.error("Admin check DB error:", e);
      return res.status(500).json({ error: "Erro ao verificar permissão" });
    }

    const user = rows?.[0];
    if (!user) {
      return res.status(403).json({ error: "Usuário não encontrado" });
    }
    const role = (user.role || "user").toString().toLowerCase();
    if (role !== "admin") {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Admin check error:", err);
    return res.status(500).json({ error: "Erro ao verificar permissão" });
  }
}
