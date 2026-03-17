import { handleAdminUsers } from "../../../lib/api/adminUsers.js";

export default async function handler(req, res) {
  const { path } = req.query || {};
  const segments = Array.isArray(path) ? path : typeof path === "string" ? [path] : [];

  // Compatibilidade com o frontend: POST /api/admin/users/:id/make-admin
  if (segments.length >= 2 && segments[1] === "make-admin") {
    return handleAdminUsers([segments[0]], req, res);
  }

  return handleAdminUsers(segments, req, res);
}

