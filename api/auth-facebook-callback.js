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
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const base = getCallbackBase(req);
  const redirectUri = `${base}/api/auth-facebook-callback`;
  if (!appId || !appSecret || !sql) {
    return res.redirect(302, `${frontendUrl}?auth_error=config`);
  }
  try {
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);
    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json().catch(() => ({}));
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.redirect(302, `${frontendUrl}?auth_error=token`);
    }
    const userUrl = new URL("https://graph.facebook.com/me");
    userUrl.searchParams.set("fields", "id,email,name");
    userUrl.searchParams.set("access_token", accessToken);
    const userRes = await fetch(userUrl.toString());
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
    console.error("Facebook callback error:", err);
    return res.redirect(302, `${frontendUrl}?auth_error=server`);
  }
}
