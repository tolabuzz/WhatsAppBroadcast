import { apiFetch } from "../lib/apiClient";
import { queryClient } from "../lib/queryClient";
import type { Contact, ImportRow } from "../types";

export interface ContactInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  notes?: string;
  groupIds?: string[];
}

function invalidateContacts() {
  queryClient.invalidateQueries({ queryKey: ["contacts"] });
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const contact = await apiFetch<Contact>("/contacts", {
    method: "POST",
    body: JSON.stringify(input),
  });
  invalidateContacts();
  return contact;
}

export async function updateContact(id: string, input: Partial<ContactInput>): Promise<void> {
  await apiFetch<Contact>(`/contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  invalidateContacts();
}

export async function deleteContact(id: string): Promise<void> {
  await apiFetch<void>(`/contacts/${id}`, { method: "DELETE" });
  invalidateContacts();
}

export async function addContactsToGroup(contactIds: string[], groupId: string, allContacts: Contact[]): Promise<void> {
  await Promise.all(
    contactIds.map((id) => {
      const contact = allContacts.find((c) => c.id === id);
      if (!contact || contact.groupIds.includes(groupId)) return Promise.resolve();
      return apiFetch(`/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ groupIds: [...contact.groupIds, groupId] }),
      });
    }),
  );
  invalidateContacts();
}

export async function removeContactFromGroup(contact: Contact, groupId: string): Promise<void> {
  await apiFetch(`/contacts/${contact.id}`, {
    method: "PATCH",
    body: JSON.stringify({ groupIds: contact.groupIds.filter((g) => g !== groupId) }),
  });
  invalidateContacts();
}

export interface ImportResult {
  created: number;
  skipped: number;
  duplicatePhones: string[];
}

export async function importContacts(rows: ImportRow[], groupIds: string[] = []): Promise<ImportResult> {
  const result = await apiFetch<ImportResult>("/contacts/import", {
    method: "POST",
    body: JSON.stringify({ rows, groupIds }),
  });
  invalidateContacts();
  return result;
}
