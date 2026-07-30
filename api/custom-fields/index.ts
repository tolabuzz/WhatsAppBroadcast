import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";
import { sql } from "../../server/db.js";
import { getOwnerEmail, withErrorHandling, ApiError } from "../../server/http.js";
import { customFieldFromRow } from "../../server/mappers.js";

const RESERVED_KEYS = new Set(["FirstName", "LastName", "FullName"]);

function deriveKey(label: string): string {
  const cleaned = label
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
  return cleaned;
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const owner = getOwnerEmail(req);

  if (req.method === "GET") {
    const { rows } = await sql`
      SELECT * FROM custom_fields WHERE owner_email = ${owner} ORDER BY created_at ASC
    `;
    res.status(200).json(rows.map(customFieldFromRow));
    return;
  }

  if (req.method === "POST") {
    const body = req.body as { label: string };
    const label = body.label?.trim();
    if (!label) throw new ApiError(400, "Label is required.");

    const key = deriveKey(label);
    if (!key || !/^[A-Za-z][A-Za-z0-9_]*$/.test(key)) {
      throw new ApiError(400, "Tag name must contain letters or numbers.");
    }
    if (RESERVED_KEYS.has(key)) {
      throw new ApiError(400, `"${key}" is a built-in tag and can't be reused.`);
    }

    const existing = await sql`
      SELECT id FROM custom_fields WHERE owner_email = ${owner} AND key = ${key}
    `;
    if (existing.rowCount && existing.rowCount > 0) {
      throw new ApiError(409, `A tag called "${key}" already exists.`);
    }

    const now = Date.now();
    const id = uuidv4();
    const { rows } = await sql`
      INSERT INTO custom_fields (id, owner_email, key, label, created_at)
      VALUES (${id}, ${owner}, ${key}, ${label}, ${now})
      RETURNING *
    `;
    res.status(201).json(customFieldFromRow(rows[0]));
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default withErrorHandling(handler);
