import { sql } from "../db.js";
import { getBearerToken, verifyToken } from "../auth.js";

const ALLOWED_STATUS = ["pending", "shipped", "completed", "canceled"];

async function requireAdmin(req, res) {
  const token = getBearerToken(req);
  const payload = verifyToken(token);
  if (!payload?.userId) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return null;
  }
  if (!sql) {
    res.status(503).json({ error: "Banco de dados não configurado" });
    return null;
  }
  const rows = await sql`SELECT role FROM users WHERE id = ${payload.userId}`;
  const user = rows?.[0];
  if (!user) {
    res.status(403).json({ error: "Usuário não encontrado" });
    return null;
  }
  const role = (user.role || "user").toString().toLowerCase();
  if (role !== "admin") {
    res.status(403).json({ error: "Acesso negado. Apenas administradores." });
    return null;
  }
  return payload;
}

function mapOrderRow(o) {
  return {
    id: o.id,
    status: o.status,
    total: Number(o.total || 0),
    created_at: o.created_at,
    updated_at: o.updated_at,
    user_id: o.user_id ?? null,
    customer_name: o.customer_name ?? null,
    customer_email: o.customer_email ?? null,
    customer_phone: o.user_phone ?? null,
  };
}

async function handleList(req, res) {
  const payload = await requireAdmin(req, res);
  if (!payload) return;
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });

  try {
    const statusParam =
      typeof req.query?.status === "string"
        ? req.query.status.trim().toLowerCase()
        : "";
    const hasFilter =
      statusParam && statusParam !== "all" && ALLOWED_STATUS.includes(statusParam);

    let rows;
    if (hasFilter) {
      rows = await sql`
        SELECT o.id,
               o.user_id,
               o.user_phone,
               o.status,
               o.total,
               o.created_at,
               o.updated_at,
               u.name  AS customer_name,
               u.email AS customer_email
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        WHERE o.status = ${statusParam}
        ORDER BY o.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT o.id,
               o.user_id,
               o.user_phone,
               o.status,
               o.total,
               o.created_at,
               o.updated_at,
               u.name  AS customer_name,
               u.email AS customer_email
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
      `;
    }

    const list = (rows || []).map(mapOrderRow);
    return res.status(200).json(list);
  } catch (err) {
    console.error("GET /api/admin/orders error:", err);
    return res.status(500).json({ error: "Erro ao listar pedidos" });
  }
}

async function handleUpdateStatus(id, req, res) {
  const payload = await requireAdmin(req, res);
  if (!payload) return;
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });

  try {
    if (!id) return res.status(400).json({ error: "ID do pedido é obrigatório" });

    const body = req.body || {};
    const status =
      typeof body.status === "string"
        ? body.status.trim().toLowerCase()
        : "";

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        error:
          "Status inválido. Use: pending, shipped, completed ou canceled.",
      });
    }

    const [existing] = await sql`
      SELECT id FROM orders WHERE id = ${id}
    `;
    if (!existing) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    const [updated] = await sql`
      UPDATE orders
      SET status = ${status}, updated_at = now()
      WHERE id = ${id}
      RETURNING id, user_id, user_phone, status, total, created_at, updated_at
    `;

    if (!updated) {
      return res.status(500).json({ error: "Erro ao atualizar pedido" });
    }

    return res.status(200).json(mapOrderRow(updated));
  } catch (err) {
    console.error("PATCH /api/admin/orders/:id/status error:", err);
    return res.status(500).json({ error: "Erro ao atualizar status do pedido" });
  }
}

export async function handleAdminOrders(pathSegments, req, res) {
  if (!sql)
    return res
      .status(503)
      .json({ error: "Banco de dados não configurado" });

  const id =
    Array.isArray(pathSegments) && pathSegments.length > 0
      ? pathSegments[0]
      : undefined;
  const second = Array.isArray(pathSegments) && pathSegments.length > 1
    ? pathSegments[1]
    : undefined;

  if (!id) {
    if (req.method !== "GET")
      return res.status(405).json({ error: "Método não permitido" });
    return await handleList(req, res);
  }

  if (second === "status" && req.method === "PATCH") {
    return await handleUpdateStatus(id, req, res);
  }

  // Futuro: detalhes do pedido etc.
  return res.status(405).json({ error: "Método não permitido" });
}

