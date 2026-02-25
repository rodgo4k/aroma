/**
 * GET /api/auth-google
 * Redireciona o usuário para a tela de login do Google.
 * Após autorização, o usuário volta em /api/auth-google-callback.
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
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const base = getCallbackBase(req);
  if (!clientId || !base) {
    return res.status(503).json({
      error: "Login com Google não configurado (GOOGLE_CLIENT_ID ou callback base).",
    });
  }
  const redirectUri = `${base}/api/auth-google-callback`;
  const scope = "email profile";
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  res.redirect(302, url.toString());
}
