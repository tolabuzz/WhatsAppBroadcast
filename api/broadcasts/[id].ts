import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../../server/db.js";
import { getIdParam, getOwnerEmail, withErrorHandling } from "../../server/http.js";
import { broadcastFromRow } from "../../server/mappers.js";

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
