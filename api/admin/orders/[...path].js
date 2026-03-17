import { handleAdminOrders } from "../../../../lib/api/adminOrders.js";

export default async function handler(req, res) {
  const { path } = req.query || {};
  const segments = Array.isArray(path) ? path : typeof path === "string" ? [path] : [];
  return handleAdminOrders(segments, req, res);
}

