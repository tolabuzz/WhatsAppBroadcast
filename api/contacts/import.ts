import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";
import { sql, toPgTextArray } from "../../server/db.js";
import { getOwnerEmail, withErrorHandling } from "../../server/http.js";
import { normalizePhone } from "../../src/lib/phone.js";

interface ImportRow {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  customData?: Record<string, string>;
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const owner = getOwnerEmail(req);
  const body = req.body as { rows: ImportRow[]; groupIds?: string[] };
  const newGroupIds = body.groupIds ?? [];

  const existing = await sql`SELECT id, phone, group_ids FROM contacts WHERE owner_email = ${owner}`;
  const existingByPhone = new Map(
    existing.rows.map((r) => [r.phone as string, { id: r.id as string, groupIds: (r.group_ids as string[]) ?? [] }]),
  );

  const now = Date.now();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of body.rows) {
    const phone = normalizePhone(row.phone);
    const firstName = row.firstName?.trim() ?? "";
    if (!firstName || !phone) {
      skipped++;
      continue;
    }
    const lastName = row.lastName?.trim() || null;
    const email = row.email?.trim() || null;
    const customData = row.customData ?? {};

    const match = existingByPhone.get(phone);
    if (match) {
      const mergedGroupIds = Array.from(new Set([...match.groupIds, ...newGroupIds]));
      await sql`
        UPDATE contacts SET
          first_name = ${firstName},
          last_name = COALESCE(${lastName}, last_name),
          email = COALESCE(${email}, email),
          group_ids = ${toPgTextArray(mergedGroupIds)}::text[],
          custom_data = custom_data || ${JSON.stringify(customData)}::jsonb,
          updated_at = ${now}
        WHERE id = ${match.id}
      `;
      updated++;
    } else {
      const id = uuidv4();
      await sql`
        INSERT INTO contacts (id, owner_email, first_name, last_name, phone, email, group_ids, custom_data, created_at, updated_at)
        VALUES (${id}, ${owner}, ${firstName}, ${lastName ?? ""}, ${phone}, ${email},
                ${toPgTextArray(newGroupIds)}::text[], ${JSON.stringify(customData)}::jsonb, ${now}, ${now})
      `;
      existingByPhone.set(phone, { id, groupIds: newGroupIds });
      created++;
    }
  }

  res.status(200).json({ created, updated, skipped });
}

export default withErrorHandling(handler);
