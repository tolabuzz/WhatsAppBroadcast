import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getOwnerEmail, withErrorHandling } from "../lib/http";
import { ensureAccountSeeded } from "../lib/seed";

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const email = getOwnerEmail(req);
  await ensureAccountSeeded(email);
  res.status(200).json({ ok: true, email });
}

export default withErrorHandling(handler);
