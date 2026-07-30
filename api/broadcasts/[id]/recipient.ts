import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../../../server/db.js";
import { getIdParam, getOwnerEmail, withErrorHandling } from "../../../server/http.js";
import { broadcastFromRow } from "../../../server/mappers.js";

interface BroadcastRecipient {
  contactId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: "pending" | "sent" | "skipped";
  sentAt?: number;
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const owner = getOwnerEmail(req);
  const id = getIdParam(req);
  const body = req.body as { index: number; status: "pending" | "sent" | "skipped" };

  const { rows } = await sql`SELECT * FROM broadcasts WHERE id = ${id} AND owner_email = ${owner}`;
  if (rows.length === 0) {
    res.status(404).json({ error: "Broadcast not found." });
    return;
  }
  const broadcast = broadcastFromRow(rows[0]);
  const recipients = broadcast.recipients as BroadcastRecipient[];
  if (body.index < 0 || body.index >= recipients.length) {
    res.status(400).json({ error: "Invalid recipient index." });
    return;
  }

  recipients[body.index] = {
    ...recipients[body.index],
    status: body.status,
    sentAt: body.status === "sent" ? Date.now() : recipients[body.index].sentAt,
  };
  const allDone = recipients.every((r) => r.status !== "pending");
  const now = Date.now();
  const currentIndex = Math.min(body.index + 1, recipients.length);

  const { rows: updated } = await sql`
    UPDATE broadcasts SET
      recipients = ${JSON.stringify(recipients)}::jsonb,
      current_index = ${currentIndex},
      status = ${allDone ? "completed" : "active"},
      updated_at = ${now}
    WHERE id = ${id} AND owner_email = ${owner}
    RETURNING *
  `;
  res.status(200).json(broadcastFromRow(updated[0]));
}

export default withErrorHandling(handler);
