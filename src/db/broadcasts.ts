import { db } from "./db";
import { newId } from "../lib/id";
import type { Broadcast, BroadcastRecipient, BroadcastStatus, Contact } from "../types";

export function recipientFromContact(contact: Contact): BroadcastRecipient {
  return {
    contactId: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    status: "pending",
  };
}

export interface BroadcastInput {
  title: string;
  messageBody: string;
  recipients: BroadcastRecipient[];
  sourceGroupIds?: string[];
}

export async function createBroadcast(
  input: BroadcastInput,
  status: BroadcastStatus = "draft",
): Promise<Broadcast> {
  const now = Date.now();
  const broadcast: Broadcast = {
    id: newId(),
    title: input.title.trim(),
    messageBody: input.messageBody,
    status,
    recipients: input.recipients,
    currentIndex: 0,
    createdAt: now,
    updatedAt: now,
    sourceGroupIds: input.sourceGroupIds,
  };
  await db.broadcasts.add(broadcast);
  return broadcast;
}

export async function updateBroadcast(id: string, patch: Partial<Broadcast>): Promise<void> {
  await db.broadcasts.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteBroadcast(id: string): Promise<void> {
  await db.broadcasts.delete(id);
}

export async function duplicateBroadcast(id: string): Promise<Broadcast | undefined> {
  const original = await db.broadcasts.get(id);
  if (!original) return undefined;
  const now = Date.now();
  const copy: Broadcast = {
    ...original,
    id: newId(),
    title: `${original.title} (Copy)`,
    status: "draft",
    currentIndex: 0,
    recipients: original.recipients.map((r) => ({ ...r, status: "pending", sentAt: undefined })),
    createdAt: now,
    updatedAt: now,
  };
  await db.broadcasts.add(copy);
  return copy;
}

export async function markRecipientStatus(
  broadcastId: string,
  index: number,
  status: BroadcastRecipient["status"],
): Promise<void> {
  const broadcast = await db.broadcasts.get(broadcastId);
  if (!broadcast) return;
  const recipients = [...broadcast.recipients];
  recipients[index] = {
    ...recipients[index],
    status,
    sentAt: status === "sent" ? Date.now() : recipients[index].sentAt,
  };
  const allDone = recipients.every((r) => r.status !== "pending");
  await db.broadcasts.update(broadcastId, {
    recipients,
    currentIndex: Math.min(index + 1, recipients.length),
    status: allDone ? "completed" : "active",
    updatedAt: Date.now(),
  });
}

export function broadcastStats(broadcast: Broadcast) {
  const total = broadcast.recipients.length;
  const sent = broadcast.recipients.filter((r) => r.status === "sent").length;
  const skipped = broadcast.recipients.filter((r) => r.status === "skipped").length;
  const pending = total - sent - skipped;
  const percentComplete = total === 0 ? 0 : Math.round(((sent + skipped) / total) * 100);
  return { total, sent, skipped, pending, percentComplete };
}
