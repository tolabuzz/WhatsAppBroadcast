import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";
import { sql } from "../lib/db";
import { getOwnerEmail, withErrorHandling } from "../lib/http";
import { templateFromRow } from "../lib/mappers";

async function handler(req: VercelRequest, res: VercelResponse) {
  const owner = getOwnerEmail(req);

  if (req.method === "GET") {
    const { rows } = await sql`
      SELECT * FROM templates WHERE owner_email = ${owner} ORDER BY updated_at DESC
    `;
    res.status(200).json(rows.map(templateFromRow));
    return;
  }

  if (req.method === "POST") {
    const body = req.body as { name: string; category: string; body: string };
    const now = Date.now();
    const id = uuidv4();
    const { rows } = await sql`
      INSERT INTO templates (id, owner_email, name, category, body, created_at, updated_at)
      VALUES (${id}, ${owner}, ${body.name.trim()}, ${body.category}, ${body.body}, ${now}, ${now})
      RETURNING *
    `;
    res.status(201).json(templateFromRow(rows[0]));
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default withErrorHandling(handler);
