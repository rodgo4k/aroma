// Vercel Serverless Function – mesma ideia do backend Express, mas serverless
export default function handler(req, res) {
  res.status(200).json({ ok: true, message: "Backend Aroma (Vercel)" });
}
