import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";
import { sql, toPgTextArray } from "../../server/db.js";
import { getIdParam, getOwnerEmail, withErrorHandling } from "../../server/http.js";
import { broadcastFromRow } from "../../server/mappers.js";

interface BroadcastRecipient {
  contactId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: "pending" | "sent" | "skipped";
  sentAt?: number;
  customData?: Record<string, string>;
}

async function handleDuplicate(res: VercelResponse, owner: string, id: string) {
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

async function handleRecipientUpdate(req: VercelRequest, res: VercelResponse, owner: string, id: string) {
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

async function handler(req: VercelRequest, res: VercelResponse) {
  const owner = getOwnerEmail(req);
  const id = getIdParam(req);

  if (req.method === "GET") {
    const { rows } = await sql`
      SELECT * FROM broadcasts WHERE id = ${id} AND owner_email = ${owner}
    `;
    if (rows.length === 0) {
      res.status(404).json({ error: "Broadcast not found." });
      return;
    }
    res.status(200).json(broadcastFromRow(rows[0]));
    return;
  }

  if (req.method === "POST") {
    const action = req.query.action;
    if (action === "duplicate") return handleDuplicate(res, owner, id);
    if (action === "recipient") return handleRecipientUpdate(req, res, owner, id);
    res.status(400).json({ error: "Unknown action." });
    return;
  }

  if (req.method === "PATCH") {
    const body = req.body as {
      title?: string;
      messageBody?: string;
      status?: string;
      recipients?: unknown;
      currentIndex?: number;
    };
    const now = Date.now();
    const title = body.title !== undefined ? body.title.trim() : null;
    const messageBody = body.messageBody ?? null;
    const status = body.status ?? null;
    const recipients = body.recipients !== undefined ? JSON.stringify(body.recipients) : null;
    const currentIndex = body.currentIndex ?? null;

    const { rows } = await sql`
      UPDATE broadcasts SET
        title = COALESCE(${title}, title),
        message_body = COALESCE(${messageBody}, message_body),
        status = COALESCE(${status}, status),
        recipients = COALESCE(${recipients}::jsonb, recipients),
        current_index = COALESCE(${currentIndex}, current_index),
        updated_at = ${now}
      WHERE id = ${id} AND owner_email = ${owner}
      RETURNING *
    `;
    if (rows.length === 0) {
      res.status(404).json({ error: "Broadcast not found." });
      return;
    }
    res.status(200).json(broadcastFromRow(rows[0]));
    return;
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM broadcasts WHERE id = ${id} AND owner_email = ${owner}`;
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default withErrorHandling(handler);
