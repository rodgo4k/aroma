import { handlePerfumes } from "../../lib/api/perfumes.js";

export default async function handler(req, res) {
  const rawPath = req.query?.path;
  const segments = Array.isArray(rawPath)
    ? rawPath
    : typeof rawPath === "string"
      ? [rawPath]
      : [];

  return handlePerfumes(segments, req, res);
}

