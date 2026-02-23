import express from "express";
import cors from "cors";
import { put } from "@vercel/blob";
import { sql } from "./lib/db.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  getBearerToken,
  verifyToken,
} from "./lib/auth.js";

const MAX_AVATAR_SIZE = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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
      SELECT id, email, name, avatar_url, birth_date, city, state, country, phone, created_at, updated_at
      FROM users WHERE id = ${payload.userId}
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
    const u = rows[0];
    return res.status(200).json({
      user: {
        id: u.id,
        email: u.email,
        name: u.name ?? null,
        avatar_url: u.avatar_url ?? null,
        birth_date: u.birth_date ?? null,
        city: u.city ?? null,
        state: u.state ?? null,
        country: u.country ?? null,
        phone: u.phone ?? null,
        created_at: u.created_at,
        updated_at: u.updated_at ?? u.created_at,
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

app.patch("/api/me", async (req, res) => {
  const token = getBearerToken(req);
  const payload = verifyToken(token);
  if (!payload?.userId) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });
  try {
    const [current] = await sql`
      SELECT id, email, name, avatar_url, birth_date, city, state, country, phone, created_at, updated_at
      FROM users WHERE id = ${payload.userId}
    `;
    if (!current) return res.status(404).json({ error: "Usuário não encontrado" });
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim() || null : current.name;
    const avatar_url = body.avatar_url !== undefined ? (typeof body.avatar_url === "string" ? body.avatar_url.trim() || null : null) : current.avatar_url;
    const birth_date = body.birth_date !== undefined ? (body.birth_date === "" || body.birth_date === null ? null : body.birth_date) : current.birth_date;
    const city = body.city !== undefined ? (typeof body.city === "string" ? body.city.trim() || null : null) : current.city;
    const state = body.state !== undefined ? (typeof body.state === "string" ? body.state.trim() || null : null) : current.state;
    const country = body.country !== undefined ? (typeof body.country === "string" ? body.country.trim() || null : null) : current.country;
    const phone = body.phone !== undefined ? (typeof body.phone === "string" ? body.phone.trim() || null : null) : current.phone;
    const [updated] = await sql`
      UPDATE users
      SET name = ${name}, avatar_url = ${avatar_url}, birth_date = ${birth_date},
          city = ${city}, state = ${state}, country = ${country}, phone = ${phone},
          updated_at = now()
      WHERE id = ${payload.userId}
      RETURNING id, email, name, avatar_url, birth_date, city, state, country, phone, created_at, updated_at
    `;
    const u = updated;
    return res.status(200).json({
      user: {
        id: u.id,
        email: u.email,
        name: u.name ?? null,
        avatar_url: u.avatar_url ?? null,
        birth_date: u.birth_date ?? null,
        city: u.city ?? null,
        state: u.state ?? null,
        country: u.country ?? null,
        phone: u.phone ?? null,
        created_at: u.created_at,
        updated_at: u.updated_at ?? u.created_at,
      },
    });
  } catch (err) {
    console.error("Me PATCH error:", err);
    return res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

app.post("/api/upload-avatar", async (req, res) => {
  const token = getBearerToken(req);
  const payload = verifyToken(token);
  if (!payload?.userId) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: "Upload não configurado (BLOB_READ_WRITE_TOKEN)" });
  }
  try {
    const dataUrl = req.body?.dataUrl || req.body?.image;
    if (!dataUrl || typeof dataUrl !== "string") {
      return res.status(400).json({ error: "Envie dataUrl com a imagem em base64" });
    }
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Formato inválido. Use data:image/...;base64,..." });
    }
    const contentType = match[1].trim().toLowerCase();
    if (!ALLOWED_AVATAR_TYPES.includes(contentType)) {
      return res.status(400).json({ error: "Tipo de imagem não permitido. Use JPEG, PNG, WebP ou GIF." });
    }
    const base64 = match[2];
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > MAX_AVATAR_SIZE) {
      return res.status(400).json({ error: "Imagem muito grande. Máximo 4 MB." });
    }
    const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
    const pathname = `avatars/${payload.userId}-${Date.now()}.${ext}`;
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error("Upload avatar error:", err);
    return res.status(500).json({ error: "Erro ao fazer upload da foto" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend rodando em http://0.0.0.0:${PORT}`);
});
