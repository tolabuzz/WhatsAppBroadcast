import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getOwnerEmail, withErrorHandling } from "../_lib/http";
import { runMigrations } from "../_lib/migrate";
import { ensureAccountSeeded } from "../_lib/seed";

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
