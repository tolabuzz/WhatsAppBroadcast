import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";

export function useContacts() {
  return useLiveQuery(() => db.contacts.orderBy("firstName").toArray(), [], []);
}

export function useGroups() {
  return useLiveQuery(() => db.groups.orderBy("name").toArray(), [], []);
}

export function useTemplates() {
  return useLiveQuery(() => db.templates.orderBy("updatedAt").reverse().toArray(), [], []);
}

export function useBroadcasts() {
  return useLiveQuery(() => db.broadcasts.orderBy("updatedAt").reverse().toArray(), [], []);
}

export function useBroadcast(id: string | undefined) {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    return db.broadcasts.get(id);
  }, [id]);
}

export function useContact(id: string | undefined) {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    return db.contacts.get(id);
  }, [id]);
}

export function useContactsInGroup(groupId: string | undefined) {
  return useLiveQuery(async () => {
    if (!groupId) return [];
    return db.contacts.where("groupIds").equals(groupId).toArray();
  }, [groupId]);
}
