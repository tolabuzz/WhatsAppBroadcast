import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getOwnerEmail, withErrorHandling } from "../../server/http.js";
import { runMigrations } from "../../server/migrate.js";
import { ensureAccountSeeded } from "../../server/seed.js";

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const email = getOwnerEmail(req);
  await runMigrations();
  await ensureAccountSeeded(email);
  res.status(200).json({ ok: true, email });
}

export default withErrorHandling(handler);
