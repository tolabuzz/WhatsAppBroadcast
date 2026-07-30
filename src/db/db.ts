import Dexie, { type EntityTable } from "dexie";
import type { Contact, Group, MessageTemplate, Broadcast } from "../types";

class BroadcastDB extends Dexie {
  contacts!: EntityTable<Contact, "id">;
  groups!: EntityTable<Group, "id">;
  templates!: EntityTable<MessageTemplate, "id">;
  broadcasts!: EntityTable<Broadcast, "id">;

  constructor() {
    super("whatsapp-broadcast-db");
    this.version(1).stores({
      contacts: "id, firstName, lastName, phone, updatedAt, *groupIds",
      groups: "id, name, createdAt",
      templates: "id, name, category, updatedAt",
      broadcasts: "id, title, status, updatedAt",
    });
  }
}

export const db = new BroadcastDB();

export const DEFAULT_GROUPS: Array<{ name: string; color: string }> = [
  { name: "Workers", color: "#128C7E" },
  { name: "Volunteers", color: "#25D366" },
  { name: "Leaders", color: "#075E54" },
  { name: "Visitors", color: "#34B7F1" },
];

export async function seedIfEmpty() {
  const groupCount = await db.groups.count();
  if (groupCount === 0) {
    const now = Date.now();
    await db.groups.bulkAdd(
      DEFAULT_GROUPS.map((g, i) => ({
        id: `seed-group-${i}`,
        name: g.name,
        color: g.color,
        createdAt: now,
      })),
    );
  }
}
