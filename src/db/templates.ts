import { db } from "./db";
import { newId } from "../lib/id";
import type { MessageTemplate, TemplateCategory } from "../types";

export interface TemplateInput {
  name: string;
  category: TemplateCategory;
  body: string;
}

export async function createTemplate(input: TemplateInput): Promise<MessageTemplate> {
  const now = Date.now();
  const template: MessageTemplate = {
    id: newId(),
    name: input.name.trim(),
    category: input.category,
    body: input.body,
    createdAt: now,
    updatedAt: now,
  };
  await db.templates.add(template);
  return template;
}

export async function updateTemplate(id: string, input: Partial<TemplateInput>): Promise<void> {
  await db.templates.update(id, { ...input, updatedAt: Date.now() });
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.templates.delete(id);
}

export const STARTER_TEMPLATES: TemplateInput[] = [
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

export async function seedTemplatesIfEmpty(): Promise<void> {
  const count = await db.templates.count();
  if (count === 0) {
    const now = Date.now();
    await db.templates.bulkAdd(
      STARTER_TEMPLATES.map((t) => ({
        id: newId(),
        ...t,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }
}
