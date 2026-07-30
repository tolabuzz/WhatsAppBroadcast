import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../../server/db.js";
import { getIdParam, getOwnerEmail, withErrorHandling } from "../../server/http.js";

async function handler(req: VercelRequest, res: VercelResponse) {
  const owner = getOwnerEmail(req);
  const id = getIdParam(req);

  if (req.method === "DELETE") {
    const { rows } = await sql`
      DELETE FROM custom_fields WHERE id = ${id} AND owner_email = ${owner} RETURNING key
    `;
    if (rows.length > 0) {
      const key = rows[0].key as string;
      // Strip the field's value out of every contact that had it set.
      await sql`
        UPDATE contacts SET custom_data = custom_data - ${key}
        WHERE owner_email = ${owner} AND jsonb_exists(custom_data, ${key})
      `;
    }
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default withErrorHandling(handler);
