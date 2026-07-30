import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";
import { sql, toPgTextArray } from "../../server/db.js";
import { getOwnerEmail, withErrorHandling } from "../../server/http.js";
import { broadcastFromRow } from "../../server/mappers.js";

interface BroadcastRecipient {
  contactId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: "pending" | "sent" | "skipped";
  sentAt?: number;
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const owner = getOwnerEmail(req);

  if (req.method === "GET") {
    const { rows } = await sql`
      SELECT * FROM broadcasts WHERE owner_email = ${owner} ORDER BY updated_at DESC
    `;
    res.status(200).json(rows.map(broadcastFromRow));
    return;
  }

  if (req.method === "POST") {
    const body = req.body as {
      title: string;
      messageBody: string;
      recipients: BroadcastRecipient[];
      sourceGroupIds?: string[];
      status?: "draft" | "active";
    };
    const now = Date.now();
    const id = uuidv4();
    const status = body.status ?? "draft";
    const { rows } = await sql`
      INSERT INTO broadcasts (id, owner_email, title, message_body, status, recipients, current_index, created_at, updated_at, source_group_ids)
      VALUES (${id}, ${owner}, ${body.title.trim()}, ${body.messageBody}, ${status},
              ${JSON.stringify(body.recipients)}::jsonb, 0, ${now}, ${now}, ${toPgTextArray(body.sourceGroupIds ?? [])}::text[])
      RETURNING *
    `;
    res.status(201).json(broadcastFromRow(rows[0]));
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default withErrorHandling(handler);
