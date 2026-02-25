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

// Proxy de imagens do Blob (evita 403 no browser quando o store é privado)
const BLOB_HOST = "blob.vercel-storage.com";
app.get("/api/perfume-image", async (req, res) => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url.trim() : "";
  if (!rawUrl) return res.status(400).json({ error: "Parâmetro url obrigatório" });
  let imageUrl;
  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: "URL inválida" });
  }
  if (!imageUrl.hostname.endsWith(BLOB_HOST) && !imageUrl.hostname.includes(BLOB_HOST)) {
    return res.status(400).json({ error: "URL não permitida" });
  }
  const token = (process.env.BLOB_READ_WRITE_TOKEN || "").trim();
  try {
    const headers = {
      Accept: "image/*",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const imageRes = await fetch(rawUrl, { headers });
    if (!imageRes.ok) {
      console.warn("Blob fetch failed:", imageRes.status, rawUrl.slice(0, 60));
      return res.status(imageRes.status).sendStatus(imageRes.status);
    }
    const contentType = imageRes.headers.get("content-type") || "image/webp";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    return res.send(buffer);
  } catch (err) {
    console.error("Perfume image proxy error:", err);
    return res.status(502).json({ error: "Erro ao carregar imagem" });
  }
});

// Normaliza UUID para chave de mapa (evita falha quando driver retorna formato diferente)
function toUuidKey(val) {
  if (val == null) return "";
  const s = String(val).trim().toLowerCase();
  return s.length > 10 ? s : "";
}

// Catálogo de perfumes (do banco) — imagens vêm da tabela perfume_images (perfume_id → url)
app.get("/api/perfumes", async (req, res) => {
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });
  try {
    const catalog = typeof req.query.catalog === "string" ? req.query.catalog.trim() : null;
    let rows;
    if (catalog && ["arabe", "feminino", "normal"].includes(catalog)) {
      rows = await sql`
        SELECT p.id, p.external_url, p.title, p.description, p.catalog_source, p.notes, p.variants, p.image_2_url
        FROM perfumes p
        WHERE p.catalog_source = ${catalog}
        ORDER BY p.title
      `;
    } else {
      rows = await sql`
        SELECT id, external_url, title, description, catalog_source, notes, variants, image_2_url
        FROM perfumes
        ORDER BY catalog_source, title
      `;
    }
    const idSet = new Set(rows.map((r) => toUuidKey(r.id)).filter(Boolean));
    const allImages = await sql`SELECT perfume_id, url, position FROM perfume_images ORDER BY perfume_id, position`;
    const imagesRows = idSet.size
      ? allImages.filter((r) => idSet.has(toUuidKey(r.perfume_id ?? r.perfumeId)))
      : [];
    const imagesByPerfume = new Map();
    for (const img of imagesRows) {
      const pid = toUuidKey(img.perfume_id ?? img.perfumeId);
      if (!pid) continue;
      const url = typeof (img.url ?? img.URL) === "string" ? (img.url ?? img.URL).trim() : "";
      if (!url) continue;
      const list = imagesByPerfume.get(pid) || [];
      const pos = Number(img.position ?? img.Position ?? list.length);
      list.push({ url, position: pos });
      imagesByPerfume.set(pid, list);
    }
    for (const [pid, arr] of imagesByPerfume) {
      arr.sort((a, b) => a.position - b.position);
      imagesByPerfume.set(pid, arr.map((x) => x.url));
    }
    const list = rows.map((p) => {
      const perfumeId = toUuidKey(p.id);
      let images = imagesByPerfume.get(perfumeId) ?? [];
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
      return {
        id: p.id,
        url: p.external_url,
        title: p.title,
        description: p.description ?? "",
        catalogSource: p.catalog_source,
        notes: p.notes ?? {},
        variants: p.variants ?? [],
        images,
      };
    });
    return res.status(200).json(list);
  } catch (err) {
    console.error("GET /api/perfumes error:", err);
    return res.status(500).json({ error: "Erro ao listar perfumes" });
  }
});

app.get("/api/perfumes/:id", async (req, res) => {
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });
  try {
    const id = req.params.id;
    const [p] = await sql`
      SELECT id, external_url, title, description, catalog_source, notes, variants, image_2_url
      FROM perfumes WHERE id = ${id}
    `;
    if (!p) return res.status(404).json({ error: "Perfume não encontrado" });
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
    });
  } catch (err) {
    console.error("GET /api/perfumes/:id error:", err);
    return res.status(500).json({ error: "Erro ao buscar perfume" });
  }
});

function oauthCallbackBase(req) {
  const proto = req.get("x-forwarded-proto") || req.protocol || "http";
  const host = req.get("x-forwarded-host") || req.get("host") || "";
  return host ? `${proto}://${host}` : process.env.OAUTH_CALLBACK_BASE || "";
}

app.get("/api/auth-google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const base = oauthCallbackBase(req);
  if (!clientId || !base) {
    return res.status(503).json({ error: "Login com Google não configurado." });
  }
  const redirectUri = `${base}/api/auth-google-callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "email profile");
  res.redirect(302, url.toString());
});

app.get("/api/auth-google-callback", async (req, res) => {
  const code = typeof req.query?.code === "string" ? req.query.code.trim() : "";
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  if (!code) return res.redirect(302, `${frontendUrl}?auth_error=missing_code`);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const base = oauthCallbackBase(req);
  const redirectUri = `${base}/api/auth-google-callback`;
  if (!clientId || !clientSecret || !sql) return res.redirect(302, `${frontendUrl}?auth_error=config`);
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    const accessToken = tokenData.access_token;
    if (!accessToken) return res.redirect(302, `${frontendUrl}?auth_error=token`);
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
    const profile = await userRes.json().catch(() => ({}));
    const email = (profile.email || "").trim().toLowerCase();
    const name = (profile.name || "").trim() || null;
    if (!email) return res.redirect(302, `${frontendUrl}?auth_error=no_email`);
    let rows = await sql`SELECT id, email, name, role FROM users WHERE email = ${email}`;
    let user = rows[0];
    if (!user) {
      const [inserted] = await sql`INSERT INTO users (email, password_hash, name) VALUES (${email}, NULL, ${name}) RETURNING id, email, name, role`;
      user = inserted;
    }
    const token = signToken({ userId: user.id, email: user.email });
    res.redirect(302, `${frontendUrl}${frontendUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error("Google callback error:", err);
    res.redirect(302, `${frontendUrl}?auth_error=server`);
  }
});

app.get("/api/auth-facebook", (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const base = oauthCallbackBase(req);
  if (!appId || !base) {
    return res.status(503).json({ error: "Login com Facebook não configurado." });
  }
  const redirectUri = `${base}/api/auth-facebook-callback`;
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "email,public_profile");
  url.searchParams.set("response_type", "code");
  res.redirect(302, url.toString());
});

app.get("/api/auth-facebook-callback", async (req, res) => {
  const code = typeof req.query?.code === "string" ? req.query.code.trim() : "";
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  if (!code) return res.redirect(302, `${frontendUrl}?auth_error=missing_code`);
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const base = oauthCallbackBase(req);
  const redirectUri = `${base}/api/auth-facebook-callback`;
  if (!appId || !appSecret || !sql) return res.redirect(302, `${frontendUrl}?auth_error=config`);
  try {
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);
    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json().catch(() => ({}));
    const accessToken = tokenData.access_token;
    if (!accessToken) return res.redirect(302, `${frontendUrl}?auth_error=token`);
    const userUrl = new URL("https://graph.facebook.com/me");
    userUrl.searchParams.set("fields", "id,email,name");
    userUrl.searchParams.set("access_token", accessToken);
    const userRes = await fetch(userUrl.toString());
    const profile = await userRes.json().catch(() => ({}));
    const email = (profile.email || "").trim().toLowerCase();
    const name = (profile.name || "").trim() || null;
    if (!email) return res.redirect(302, `${frontendUrl}?auth_error=no_email`);
    let rows = await sql`SELECT id, email, name, role FROM users WHERE email = ${email}`;
    let user = rows[0];
    if (!user) {
      const [inserted] = await sql`INSERT INTO users (email, password_hash, name) VALUES (${email}, NULL, ${name}) RETURNING id, email, name, role`;
      user = inserted;
    }
    const token = signToken({ userId: user.id, email: user.email });
    res.redirect(302, `${frontendUrl}${frontendUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error("Facebook callback error:", err);
    res.redirect(302, `${frontendUrl}?auth_error=server`);
  }
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
      SELECT id, email, name, password_hash, role FROM users WHERE email = ${emailTrim}
    `;
    if (rows.length === 0) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }
    const user = rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: "Esta conta usa login com Google ou Facebook." });
    }
    const valid = await verifyPassword(passwordStr, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Email ou senha incorretos" });
    const token = signToken({ userId: user.id, email: user.email });
    return res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role ?? "user" },
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
    let rows;
    try {
      rows = await sql`
        SELECT id, email, name, avatar_url, birth_date, city, state, country, phone, role, created_at, updated_at
        FROM users WHERE id = ${payload.userId}
      `;
    } catch (schemaErr) {
      rows = await sql`
        SELECT id, email, name, created_at, updated_at
        FROM users WHERE id = ${payload.userId}
      `;
      if (rows.length > 0) {
        rows[0].avatar_url = null;
        rows[0].birth_date = null;
        rows[0].city = null;
        rows[0].state = null;
        rows[0].country = null;
        rows[0].phone = null;
        rows[0].role = "user";
      }
    }
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
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
        role: u.role ?? "user",
        created_at: u.created_at,
        updated_at: u.updated_at ?? u.created_at,
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    const message =
      process.env.NODE_ENV !== "production" ? err.message : "Erro ao buscar usuário";
    return res.status(500).json({ error: message });
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
      SELECT id, email, name, avatar_url, birth_date, city, state, country, phone, role, created_at, updated_at
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
      RETURNING id, email, name, avatar_url, birth_date, city, state, country, phone, role, created_at, updated_at
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
        role: u.role ?? "user",
        created_at: u.created_at,
        updated_at: u.updated_at ?? u.created_at,
      },
    });
  } catch (err) {
    console.error("Me PATCH error:", err);
    return res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

app.get("/api/admin-check", async (req, res) => {
  const token = getBearerToken(req);
  const payload = verifyToken(token);
  if (!payload?.userId) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });
  try {
    const rows = await sql`SELECT role FROM users WHERE id = ${payload.userId}`;
    const user = rows?.[0];
    if (!user) return res.status(403).json({ error: "Usuário não encontrado" });
    const role = (user.role || "user").toString().toLowerCase();
    if (role !== "admin") {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Admin check error:", err);
    return res.status(500).json({ error: "Erro ao verificar permissão" });
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
