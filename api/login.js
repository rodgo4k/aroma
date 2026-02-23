import { sql } from "../lib/db.js";
import { verifyPassword, signToken } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  if (!sql) {
    return res.status(503).json({ error: "Banco de dados não configurado" });
  }

  try {
    const { email, password } = req.body || {};
    const emailTrim = typeof email === "string" ? email.trim().toLowerCase() : "";
    const passwordStr = typeof password === "string" ? password : "";

    if (!emailTrim || !passwordStr) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const rows = await sql`
      SELECT id, email, name, password_hash
      FROM users
      WHERE email = ${emailTrim}
    `;

    if (rows.length === 0) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    const user = rows[0];
    const valid = await verifyPassword(passwordStr, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    const token = signToken({ userId: user.id, email: user.email });
    return res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Erro ao fazer login" });
  }
}
