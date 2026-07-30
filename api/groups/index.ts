import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";
import { sql } from "../../server/db";
import { getOwnerEmail, withErrorHandling } from "../../server/http";
import { groupFromRow } from "../../server/mappers";

const GROUP_COLORS = ["#128C7E", "#25D366", "#075E54", "#34B7F1", "#D97706", "#8B5CF6", "#EC4899"];

async function handler(req: VercelRequest, res: VercelResponse) {
  const owner = getOwnerEmail(req);

  if (req.method === "GET") {
    const { rows } = await sql`SELECT * FROM groups WHERE owner_email = ${owner} ORDER BY name ASC`;
    res.status(200).json(rows.map(groupFromRow));
    return;
  }

  if (req.method === "POST") {
    const body = req.body as { name: string };
    const countResult = await sql`SELECT COUNT(*) FROM groups WHERE owner_email = ${owner}`;
    const count = Number(countResult.rows[0].count);
    const color = GROUP_COLORS[count % GROUP_COLORS.length];
    const now = Date.now();
    const id = uuidv4();
    const { rows } = await sql`
      INSERT INTO groups (id, owner_email, name, color, created_at)
      VALUES (${id}, ${owner}, ${body.name.trim()}, ${color}, ${now})
      RETURNING *
    `;
    res.status(201).json(groupFromRow(rows[0]));
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default withErrorHandling(handler);
