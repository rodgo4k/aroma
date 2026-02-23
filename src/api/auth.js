const BASE = import.meta.env.VITE_API_URL || "";

export async function register({ email, password, name }) {
  const url = `${BASE}/api/register`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: name || undefined }),
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};
  if (!res.ok) {
    const msg =
      data.error ||
      (res.status === 503
        ? "Backend indisponível. Verifique DATABASE_URL e se o backend está rodando."
        : res.status === 404 || res.status >= 500
          ? "Servidor indisponível. Tente de novo ou confira a conexão com o backend."
          : "Erro ao criar conta.");
    throw new Error(msg);
  }
  return data;
}

export async function login({ email, password }) {
  const res = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};
  if (!res.ok) {
    const msg =
      data.error ||
      (res.status === 503
        ? "Backend indisponível. Verifique DATABASE_URL e se o backend está rodando."
        : "Erro ao fazer login.");
    throw new Error(msg);
  }
  return data;
}

export function getStoredToken() {
  return localStorage.getItem("token");
}

export function setStoredToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export async function getMe() {
  const token = getStoredToken();
  if (!token) return null;
  const res = await fetch(`${BASE}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data?.user ?? null;
}
