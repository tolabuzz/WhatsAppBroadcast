import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../../server/db";
import { getIdParam, getOwnerEmail, withErrorHandling } from "../../server/http";
import { groupFromRow } from "../../server/mappers";

async function handler(req: VercelRequest, res: VercelResponse) {
  const owner = getOwnerEmail(req);
  const id = getIdParam(req);

  if (req.method === "PATCH") {
    const body = req.body as { name: string };
    const { rows } = await sql`
      UPDATE groups SET name = ${body.name.trim()}
      WHERE id = ${id} AND owner_email = ${owner}
      RETURNING *
    `;
    if (rows.length === 0) {
      res.status(404).json({ error: "Group not found." });
      return;
    }
    res.status(200).json(groupFromRow(rows[0]));
    return;
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM groups WHERE id = ${id} AND owner_email = ${owner}`;
    // Pull this group id out of every contact that references it.
    await sql`
      UPDATE contacts SET group_ids = array_remove(group_ids, ${id})
      WHERE owner_email = ${owner} AND ${id} = ANY(group_ids)
    `;
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default withErrorHandling(handler);
