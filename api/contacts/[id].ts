import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, toPgTextArray } from "../lib/db";
import { getIdParam, getOwnerEmail, withErrorHandling } from "../lib/http";
import { contactFromRow } from "../lib/mappers";
import { normalizePhone } from "../../src/lib/phone";

async function handler(req: VercelRequest, res: VercelResponse) {
  const owner = getOwnerEmail(req);
  const id = getIdParam(req);

  if (req.method === "PATCH") {
    const body = req.body as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      notes?: string;
      groupIds?: string[];
    };
    const now = Date.now();
    const firstName = body.firstName !== undefined ? body.firstName.trim() : null;
    const lastName = body.lastName !== undefined ? body.lastName.trim() : null;
    const phone = body.phone !== undefined ? normalizePhone(body.phone) : null;
    const emailProvided = body.email !== undefined;
    const emailValue = body.email?.trim() || null;
    const notesProvided = body.notes !== undefined;
    const notesValue = body.notes?.trim() || null;
    const groupIdsLiteral = body.groupIds !== undefined ? toPgTextArray(body.groupIds) : null;

    const { rows } = await sql`
      UPDATE contacts SET
        first_name = COALESCE(${firstName}, first_name),
        last_name = COALESCE(${lastName}, last_name),
        phone = COALESCE(${phone}, phone),
        email = CASE WHEN ${emailProvided} THEN ${emailValue} ELSE email END,
        notes = CASE WHEN ${notesProvided} THEN ${notesValue} ELSE notes END,
        group_ids = COALESCE(${groupIdsLiteral}::text[], group_ids),
        updated_at = ${now}
      WHERE id = ${id} AND owner_email = ${owner}
      RETURNING *
    `;
    if (rows.length === 0) {
      res.status(404).json({ error: "Contact not found." });
      return;
    }
    res.status(200).json(contactFromRow(rows[0]));
    return;
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM contacts WHERE id = ${id} AND owner_email = ${owner}`;
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default withErrorHandling(handler);
