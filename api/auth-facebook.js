/**
 * GET /api/auth-facebook
 * Redireciona o usuário para a tela de login do Facebook.
 * Após autorização, o usuário volta em /api/auth-facebook-callback.
 */
function getCallbackBase(req) {
  const host = req.headers["x-forwarded-host"] || req.headers["host"] || "";
  const proto = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return host ? `${proto}://${host}` : process.env.OAUTH_CALLBACK_BASE || "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }
  const appId = process.env.FACEBOOK_APP_ID;
  const base = getCallbackBase(req);
  if (!appId || !base) {
    return res.status(503).json({
      error: "Login com Facebook não configurado (FACEBOOK_APP_ID ou callback base).",
    });
  }
  const redirectUri = `${base}/api/auth-facebook-callback`;
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "email,public_profile");
  url.searchParams.set("response_type", "code");
  res.redirect(302, url.toString());
}
