import { sql } from "../lib/db.js";
import { getBearerToken, verifyToken } from "../lib/auth.js";

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
    const rows = await sql`
      SELECT id, email, name, created_at
      FROM users
      WHERE id = ${payload.userId}
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const user = rows[0];
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Erro ao buscar usuário" });
  }
}
