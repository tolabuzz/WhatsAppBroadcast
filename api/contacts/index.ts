import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";
import { sql, toPgTextArray } from "../lib/db";
import { getOwnerEmail, withErrorHandling } from "../lib/http";
import { contactFromRow } from "../lib/mappers";
import { normalizePhone } from "../../src/lib/phone";

async function handler(req: VercelRequest, res: VercelResponse) {
  const owner = getOwnerEmail(req);

  if (req.method === "GET") {
    const { rows } = await sql`
      SELECT * FROM contacts WHERE owner_email = ${owner} ORDER BY first_name ASC
    `;
    res.status(200).json(rows.map(contactFromRow));
    return;
  }

  if (req.method === "POST") {
    const body = req.body as {
      firstName: string;
      lastName?: string;
      phone: string;
      email?: string;
      notes?: string;
      groupIds?: string[];
    };
    const now = Date.now();
    const id = uuidv4();
    const phone = normalizePhone(body.phone);
    const { rows } = await sql`
      INSERT INTO contacts (id, owner_email, first_name, last_name, phone, email, notes, group_ids, created_at, updated_at)
      VALUES (${id}, ${owner}, ${body.firstName.trim()}, ${body.lastName?.trim() ?? ""}, ${phone},
              ${body.email?.trim() || null}, ${body.notes?.trim() || null}, ${toPgTextArray(body.groupIds ?? [])}::text[], ${now}, ${now})
      RETURNING *
    `;
    res.status(201).json(contactFromRow(rows[0]));
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default withErrorHandling(handler);
