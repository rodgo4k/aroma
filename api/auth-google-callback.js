import { sql } from "../lib/db.js";
import { signToken } from "../lib/auth.js";

function getCallbackBase(req) {
  const host = req.headers["x-forwarded-host"] || req.headers["host"] || "";
  const proto = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return host ? `${proto}://${host}` : process.env.OAUTH_CALLBACK_BASE || "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }
  const code = typeof req.query?.code === "string" ? req.query.code.trim() : "";
  const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "") || "/";
  if (!code) {
    return res.redirect(302, `${frontendUrl}?auth_error=missing_code`);
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const base = getCallbackBase(req);
  const redirectUri = `${base}/api/auth-google-callback`;
  if (!clientId || !clientSecret || !sql) {
    return res.redirect(302, `${frontendUrl}?auth_error=config`);
  }
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.redirect(302, `${frontendUrl}?auth_error=token`);
    }
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await userRes.json().catch(() => ({}));
    const email = (profile.email || "").trim().toLowerCase();
    const name = (profile.name || "").trim() || null;
    if (!email) {
      return res.redirect(302, `${frontendUrl}?auth_error=no_email`);
    }
    let rows = await sql`SELECT id, email, name, role FROM users WHERE email = ${email}`;
    let user;
    if (rows.length > 0) {
      user = rows[0];
    } else {
      const [inserted] = await sql`
        INSERT INTO users (email, password_hash, name)
        VALUES (${email}, NULL, ${name})
        RETURNING id, email, name, role
      `;
      user = inserted;
    }
    const token = signToken({ userId: user.id, email: user.email });
    const sep = frontendUrl.includes("?") ? "&" : "?";
    return res.redirect(302, `${frontendUrl}${sep}token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error("Google callback error:", err);
    return res.redirect(302, `${frontendUrl}?auth_error=server`);
  }
}
