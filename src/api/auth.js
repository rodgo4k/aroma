const BASE = import.meta.env.VITE_API_URL || "";

export async function register({ email, password, name }) {
  const res = await fetch(`${BASE}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: name || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro ao criar conta");
  return data;
}

export async function login({ email, password }) {
  const res = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro ao fazer login");
  return data;
}

export function getStoredToken() {
  return localStorage.getItem("token");
}

export function setStoredToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}
