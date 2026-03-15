import { handleLogin } from "../lib/api/login.js";
import { handleRegister } from "../lib/api/register.js";
import { handleAdminCheck } from "../lib/api/adminCheck.js";
import { handleMe } from "../lib/api/me.js";
import { handleUploadAvatar } from "../lib/api/uploadAvatar.js";
import { handlePerfumes } from "../lib/api/perfumes.js";
import { handleAdminUsers } from "../lib/api/adminUsers.js";
import { handleAdminOrders } from "../lib/api/adminOrders.js";
import { handleMyOrders } from "../lib/api/myOrders.js";

export default async function handler(req, res) {
  // 1) Tenta req.query.path (padrão Vercel para [[...path]])
  let segments = [];
  const qp = req.query && req.query.path;
  if (Array.isArray(qp)) {
    segments = qp;
  } else if (typeof qp === "string" && qp.length) {
    segments = qp.split("/").filter(Boolean);
  }
  // 2) Fallback: extrai de req.url (garante funcionar em produção na Vercel)
  if (segments.length === 0) {
    const rawUrl = req.url || req.originalUrl || "";
    const pathOnly = rawUrl.split("?")[0] || "";
    let path = pathOnly.startsWith("/api") ? pathOnly.slice(4) : pathOnly;
    if (path.startsWith("/")) path = path.slice(1);
    segments = path ? path.split("/").filter(Boolean) : [];
  }

  const [first, ...rest] = segments;

  try {
    switch (first) {
      case "login":
        return await handleLogin(req, res);
      case "register":
        return await handleRegister(req, res);
      case "admin-check":
        return await handleAdminCheck(req, res);
      case "me":
        return await handleMe(req, res);
      case "upload-avatar":
        return await handleUploadAvatar(req, res);
      case "perfumes":
        return await handlePerfumes(rest, req, res);
      case "my-orders":
        return await handleMyOrders(rest, req, res);
      case "admin": {
        const [section, ...adminRest] = rest;
        if (section === "users") {
          return await handleAdminUsers(adminRest, req, res);
        }
        if (section === "orders") {
          return await handleAdminOrders(adminRest, req, res);
        }
        break;
      }
      default:
        break;
    }

    return res.status(404).json({ error: "Rota não encontrada" });
  } catch (err) {
    console.error("API router error:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}


