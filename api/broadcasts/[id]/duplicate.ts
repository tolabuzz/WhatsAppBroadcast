import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";
import { sql, toPgTextArray } from "../../lib/db";
import { getIdParam, getOwnerEmail, withErrorHandling } from "../../lib/http";
import { broadcastFromRow } from "../../lib/mappers";

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

  const { rows } = await sql`SELECT * FROM broadcasts WHERE id = ${id} AND owner_email = ${owner}`;
  if (rows.length === 0) {
    res.status(404).json({ error: "Broadcast not found." });
    return;
  }
  const original = broadcastFromRow(rows[0]);
  const recipients = (original.recipients as BroadcastRecipient[]).map((r) => ({
    ...r,
    status: "pending" as const,
    sentAt: undefined,
  }));

  const now = Date.now();
  const newId = uuidv4();
  const { rows: inserted } = await sql`
    INSERT INTO broadcasts (id, owner_email, title, message_body, status, recipients, current_index, created_at, updated_at, source_group_ids)
    VALUES (${newId}, ${owner}, ${`${original.title} (Copy)`}, ${original.messageBody}, 'draft',
            ${JSON.stringify(recipients)}::jsonb, 0, ${now}, ${now}, ${toPgTextArray(original.sourceGroupIds ?? [])}::text[])
    RETURNING *
  `;
  res.status(201).json(broadcastFromRow(inserted[0]));
}

export default withErrorHandling(handler);
