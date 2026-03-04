import { handleLogin } from "../lib/api/login.js";
import { handleRegister } from "../lib/api/register.js";
import { handleAdminCheck } from "../lib/api/adminCheck.js";
import { handleMe } from "../lib/api/me.js";
import { handleUploadAvatar } from "../lib/api/uploadAvatar.js";
import { handlePerfumes } from "../lib/api/perfumes.js";
import { handleAdminUsers } from "../lib/api/adminUsers.js";

export default async function handler(req, res) {
  const rawPath = req.query?.path;
  const segments = Array.isArray(rawPath)
    ? rawPath
    : typeof rawPath === "string"
      ? [rawPath]
      : [];

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
      case "admin":
        if (rest[0] === "users") {
          return await handleAdminUsers(rest.slice(1), req, res);
        }
        break;
      default:
        break;
    }

    return res.status(404).json({ error: "Rota não encontrada" });
  } catch (err) {
    console.error("API router error:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

