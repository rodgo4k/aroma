import { handleAdminOrders } from "../../lib/api/adminOrders.js";

export default async function handler(req, res) {
  // Lista de pedidos para o painel admin
  return handleAdminOrders([], req, res);
}

