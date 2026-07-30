import { db } from "./db";
import { newId } from "../lib/id";
import { normalizePhone } from "../lib/phone";
import type { Contact, ImportRow } from "../types";

export interface ContactInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  notes?: string;
  groupIds?: string[];
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const now = Date.now();
  const contact: Contact = {
    id: newId(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: normalizePhone(input.phone),
    email: input.email?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    groupIds: input.groupIds ?? [],
    createdAt: now,
    updatedAt: now,
  };
  await db.contacts.add(contact);
  return contact;
}

export async function updateContact(id: string, input: Partial<ContactInput>): Promise<void> {
  const patch: Partial<Contact> = { updatedAt: Date.now() };
  if (input.firstName !== undefined) patch.firstName = input.firstName.trim();
  if (input.lastName !== undefined) patch.lastName = input.lastName.trim();
  if (input.phone !== undefined) patch.phone = normalizePhone(input.phone);
  if (input.email !== undefined) patch.email = input.email.trim() || undefined;
  if (input.notes !== undefined) patch.notes = input.notes.trim() || undefined;
  if (input.groupIds !== undefined) patch.groupIds = input.groupIds;
  await db.contacts.update(id, patch);
}

export async function deleteContact(id: string): Promise<void> {
  await db.contacts.delete(id);
}

export async function deleteContacts(ids: string[]): Promise<void> {
  await db.contacts.bulkDelete(ids);
}

export async function addContactsToGroup(contactIds: string[], groupId: string): Promise<void> {
  await db.transaction("rw", db.contacts, async () => {
    for (const id of contactIds) {
      const contact = await db.contacts.get(id);
      if (contact && !contact.groupIds.includes(groupId)) {
        await db.contacts.update(id, {
          groupIds: [...contact.groupIds, groupId],
          updatedAt: Date.now(),
        });
      }
    }
  });
}

export async function removeContactFromGroup(contactId: string, groupId: string): Promise<void> {
  const contact = await db.contacts.get(contactId);
  if (contact) {
    await db.contacts.update(contactId, {
      groupIds: contact.groupIds.filter((g) => g !== groupId),
      updatedAt: Date.now(),
    });
  }
}

export interface ImportResult {
  created: number;
  skipped: number;
  duplicatePhones: string[];
}

export async function importContacts(
  rows: ImportRow[],
  groupIds: string[] = [],
): Promise<ImportResult> {
  const existing = await db.contacts.toArray();
  const existingPhones = new Set(existing.map((c) => c.phone));
  const now = Date.now();
  let created = 0;
  let skipped = 0;
  const duplicatePhones: string[] = [];
  const toAdd: Contact[] = [];

  for (const row of rows) {
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
    toAdd.push({
      id: newId(),
      firstName: row.firstName,
      lastName: row.lastName ?? "",
      phone,
      email: row.email || undefined,
      groupIds,
      createdAt: now,
      updatedAt: now,
    });
    created++;
  }

  if (toAdd.length > 0) {
    await db.contacts.bulkAdd(toAdd);
  }

  return { created, skipped, duplicatePhones };
}
