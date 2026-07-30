import { sql } from "./db.js";
import { v4 as uuidv4 } from "uuid";

const STARTER_TEMPLATES: Array<{ name: string; category: string; body: string }> = [
  {
    name: "Meeting Reminder",
    category: "Meeting Reminder",
    body: "Hi {{FirstName}},\n\nJust a reminder that our meeting starts today at 5:00 PM. Looking forward to seeing you there!",
  },
  {
    name: "Birthday Wishes",
    category: "Birthday",
    body: "Happy birthday, {{FirstName}}! 🎉 Wishing you a wonderful year ahead filled with joy and blessings.",
  },
  {
    name: "Event Reminder",
    category: "Event Reminder",
    body: "Hi {{FirstName}}, this is a friendly reminder about our upcoming event. We'd love to have you there!",
  },
  {
    name: "Follow-up",
    category: "Follow-up",
    body: "Hi {{FirstName}}, just following up on our last conversation. Let me know if you have any questions!",
  },
];

/** Ensures the account row exists; seeds starter templates the first time this email is seen. */
export async function ensureAccountSeeded(email: string): Promise<void> {
  const existing = await sql`SELECT email FROM accounts WHERE email = ${email}`;
  if (existing.rowCount && existing.rowCount > 0) return;

  const now = Date.now();
  await sql`INSERT INTO accounts (email, created_at) VALUES (${email}, ${now}) ON CONFLICT DO NOTHING`;

  for (const t of STARTER_TEMPLATES) {
    await sql`
      INSERT INTO templates (id, owner_email, name, category, body, created_at, updated_at)
      VALUES (${uuidv4()}, ${email}, ${t.name}, ${t.category}, ${t.body}, ${now}, ${now})
    `;
  }
}
