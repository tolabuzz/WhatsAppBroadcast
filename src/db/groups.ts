import { db } from "./db";
import { newId } from "../lib/id";
import type { Group } from "../types";

const GROUP_COLORS = ["#128C7E", "#25D366", "#075E54", "#34B7F1", "#D97706", "#8B5CF6", "#EC4899"];

export function pickGroupColor(index: number): string {
  return GROUP_COLORS[index % GROUP_COLORS.length];
}

export async function createGroup(name: string): Promise<Group> {
  const count = await db.groups.count();
  const group: Group = {
    id: newId(),
    name: name.trim(),
    color: pickGroupColor(count),
    createdAt: Date.now(),
  };
  await db.groups.add(group);
  return group;
}

export async function renameGroup(id: string, name: string): Promise<void> {
  await db.groups.update(id, { name: name.trim() });
}

export async function deleteGroup(id: string): Promise<void> {
  await db.transaction("rw", db.groups, db.contacts, async () => {
    await db.groups.delete(id);
    const contacts = await db.contacts.where("groupIds").equals(id).toArray();
    for (const contact of contacts) {
      await db.contacts.update(contact.id, {
        groupIds: contact.groupIds.filter((g) => g !== id),
      });
    }
  });
}
