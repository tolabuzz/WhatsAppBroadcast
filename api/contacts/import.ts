import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";
import { sql, toPgTextArray } from "../_lib/db";
import { getOwnerEmail, withErrorHandling } from "../_lib/http";
import { normalizePhone } from "../../src/lib/phone";

interface ImportRow {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const owner = getOwnerEmail(req);
  const body = req.body as { rows: ImportRow[]; groupIds?: string[] };
  const groupIdsLiteral = toPgTextArray(body.groupIds ?? []);

  const existing = await sql`SELECT phone FROM contacts WHERE owner_email = ${owner}`;
  const existingPhones = new Set(existing.rows.map((r) => r.phone as string));

  const now = Date.now();
  let created = 0;
  let skipped = 0;
  const duplicatePhones: string[] = [];

  for (const row of body.rows) {
    const phone = normalizePhone(row.phone);
    if (!row.firstName || !phone) {
      skipped++;
      continue;
    }
    if (existingPhones.has(phone)) {
      duplicatePhones.push(phone);
      skipped++;
      continue;
    }
    existingPhones.add(phone);
    await sql`
      INSERT INTO contacts (id, owner_email, first_name, last_name, phone, email, group_ids, created_at, updated_at)
      VALUES (${uuidv4()}, ${owner}, ${row.firstName}, ${row.lastName ?? ""}, ${phone},
              ${row.email || null}, ${groupIdsLiteral}::text[], ${now}, ${now})
    `;
    created++;
  }

  res.status(200).json({ created, skipped, duplicatePhones });
}

export default withErrorHandling(handler);
