import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../../server/db";
import { getIdParam, getOwnerEmail, withErrorHandling } from "../../server/http";
import { templateFromRow } from "../../server/mappers";

async function handler(req: VercelRequest, res: VercelResponse) {
  const owner = getOwnerEmail(req);
  const id = getIdParam(req);

  if (req.method === "PATCH") {
    const body = req.body as { name?: string; category?: string; body?: string };
    const now = Date.now();
    const name = body.name !== undefined ? body.name.trim() : null;
    const category = body.category ?? null;
    const templateBody = body.body ?? null;

    const { rows } = await sql`
      UPDATE templates SET
        name = COALESCE(${name}, name),
        category = COALESCE(${category}, category),
        body = COALESCE(${templateBody}, body),
        updated_at = ${now}
      WHERE id = ${id} AND owner_email = ${owner}
      RETURNING *
    `;
    if (rows.length === 0) {
      res.status(404).json({ error: "Template not found." });
      return;
    }
    res.status(200).json(templateFromRow(rows[0]));
    return;
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM templates WHERE id = ${id} AND owner_email = ${owner}`;
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default withErrorHandling(handler);
