import { apiFetch } from "../lib/apiClient";
import { queryClient } from "../lib/queryClient";
import type { Group } from "../types";

function invalidateGroups() {
  queryClient.invalidateQueries({ queryKey: ["groups"] });
}

export async function createGroup(name: string): Promise<Group> {
  const group = await apiFetch<Group>("/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  invalidateGroups();
  return group;
}

export async function renameGroup(id: string, name: string): Promise<void> {
  await apiFetch<Group>(`/groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
  invalidateGroups();
}

export async function deleteGroup(id: string): Promise<void> {
  await apiFetch<void>(`/groups/${id}`, { method: "DELETE" });
  invalidateGroups();
  queryClient.invalidateQueries({ queryKey: ["contacts"] });
}
