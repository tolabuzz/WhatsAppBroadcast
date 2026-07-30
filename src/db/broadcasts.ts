import { apiFetch } from "../lib/apiClient";
import { queryClient } from "../lib/queryClient";
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

function invalidateBroadcasts() {
  queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
  queryClient.invalidateQueries({ queryKey: ["broadcast"] });
}

export async function createBroadcast(
  input: BroadcastInput,
  status: BroadcastStatus = "draft",
): Promise<Broadcast> {
  const broadcast = await apiFetch<Broadcast>("/broadcasts", {
    method: "POST",
    body: JSON.stringify({ ...input, status }),
  });
  invalidateBroadcasts();
  return broadcast;
}

export async function updateBroadcast(id: string, patch: Partial<Broadcast>): Promise<void> {
  await apiFetch<Broadcast>(`/broadcasts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  invalidateBroadcasts();
}

export async function deleteBroadcast(id: string): Promise<void> {
  await apiFetch<void>(`/broadcasts/${id}`, { method: "DELETE" });
  invalidateBroadcasts();
}

export async function duplicateBroadcast(id: string): Promise<Broadcast | undefined> {
  const copy = await apiFetch<Broadcast>(`/broadcasts/${id}/duplicate`, { method: "POST" });
  invalidateBroadcasts();
  return copy;
}

export async function markRecipientStatus(
  broadcastId: string,
  index: number,
  status: BroadcastRecipient["status"],
): Promise<void> {
  await apiFetch<Broadcast>(`/broadcasts/${broadcastId}/recipient`, {
    method: "POST",
    body: JSON.stringify({ index, status }),
  });
  invalidateBroadcasts();
}

export function broadcastStats(broadcast: Broadcast) {
  const total = broadcast.recipients.length;
  const sent = broadcast.recipients.filter((r) => r.status === "sent").length;
  const skipped = broadcast.recipients.filter((r) => r.status === "skipped").length;
  const pending = total - sent - skipped;
  const percentComplete = total === 0 ? 0 : Math.round(((sent + skipped) / total) * 100);
  return { total, sent, skipped, pending, percentComplete };
}
