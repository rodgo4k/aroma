import { sql } from "../lib/db.js";
import { hashPassword, signToken } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  if (!sql) {
    return res.status(503).json({ error: "Banco de dados não configurado" });
  }

  try {
    const { email, password, name } = req.body || {};
    const emailTrim = typeof email === "string" ? email.trim().toLowerCase() : "";
    const passwordStr = typeof password === "string" ? password : "";

    if (!emailTrim || !passwordStr) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    if (passwordStr.length < 6) {
      return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${emailTrim}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: "Este email já está em uso" });
    }

    const password_hash = await hashPassword(passwordStr);
    const [user] = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${emailTrim}, ${password_hash}, ${name?.trim() || null})
      RETURNING id, email, name, created_at
    `;

    const token = signToken({ userId: user.id, email: user.email });
    return res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Erro ao criar conta" });
  }
}
