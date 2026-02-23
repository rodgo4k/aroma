import express from "express";
import cors from "cors";
import { sql } from "./lib/db.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  getBearerToken,
  verifyToken,
} from "./lib/auth.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend Aroma" });
});

app.post("/api/register", async (req, res) => {
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });
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
});

app.post("/api/login", async (req, res) => {
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });
  try {
    const { email, password } = req.body || {};
    const emailTrim = typeof email === "string" ? email.trim().toLowerCase() : "";
    const passwordStr = typeof password === "string" ? password : "";
    if (!emailTrim || !passwordStr) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    const rows = await sql`
      SELECT id, email, name, password_hash FROM users WHERE email = ${emailTrim}
    `;
    if (rows.length === 0) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }
    const user = rows[0];
    const valid = await verifyPassword(passwordStr, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Email ou senha incorretos" });
    const token = signToken({ userId: user.id, email: user.email });
    return res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Erro ao fazer login" });
  }
});

app.get("/api/me", async (req, res) => {
  const token = getBearerToken(req);
  const payload = verifyToken(token);
  if (!payload?.userId) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });
  try {
    const rows = await sql`
      SELECT id, email, name, created_at FROM users WHERE id = ${payload.userId}
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
    const user = rows[0];
    return res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name, created_at: user.created_at },
    });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend rodando em http://0.0.0.0:${PORT}`);
});
