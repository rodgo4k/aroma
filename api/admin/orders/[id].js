import { handleAdminOrders } from "../../../../lib/api/adminOrders.js";

export default async function handler(req, res) {
  const { id } = req.query || {};
  const segments = id ? [id] : [];
  return handleAdminOrders(segments, req, res);
}

