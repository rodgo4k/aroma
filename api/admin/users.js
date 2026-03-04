import { handleAdminUsers } from "../../lib/api/adminUsers.js";

export default async function handler(req, res) {
  // Lista todos os usuários (sem segmento de ID)
  return handleAdminUsers([], req, res);
}

