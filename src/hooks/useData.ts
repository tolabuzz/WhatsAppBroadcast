import { useQuery } from "@tanstack/react-query";
import { useAccount } from "../context/AccountContext";
import { apiFetch } from "../lib/apiClient";
import type { Broadcast, Contact, Group, MessageTemplate } from "../types";

export function useContacts() {
  const { email } = useAccount();
  const { data } = useQuery({
    queryKey: ["contacts", email],
    queryFn: () => apiFetch<Contact[]>("/contacts"),
    enabled: !!email,
  });
  return data;
}

export function useGroups() {
  const { email } = useAccount();
  const { data } = useQuery({
    queryKey: ["groups", email],
    queryFn: () => apiFetch<Group[]>("/groups"),
    enabled: !!email,
  });
  return data;
}

export function useTemplates() {
  const { email } = useAccount();
  const { data } = useQuery({
    queryKey: ["templates", email],
    queryFn: () => apiFetch<MessageTemplate[]>("/templates"),
    enabled: !!email,
  });
  return data;
}

export function useBroadcasts() {
  const { email } = useAccount();
  const { data } = useQuery({
    queryKey: ["broadcasts", email],
    queryFn: () => apiFetch<Broadcast[]>("/broadcasts"),
    enabled: !!email,
  });
  return data;
}

export function useBroadcast(id: string | undefined) {
  const { email } = useAccount();
  const { data } = useQuery({
    queryKey: ["broadcast", email, id],
    queryFn: () => apiFetch<Broadcast>(`/broadcasts/${id}`),
    enabled: !!email && !!id,
    refetchInterval: 0,
  });
  return data;
}

export function useGroup(id: string | undefined) {
  const groups = useGroups();
  return groups?.find((g) => g.id === id);
}

export function useContactsInGroup(groupId: string | undefined) {
  const contacts = useContacts();
  if (!groupId) return [] as Contact[];
  return (contacts ?? []).filter((c) => c.groupIds.includes(groupId));
}
