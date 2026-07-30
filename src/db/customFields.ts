import { apiFetch } from "../lib/apiClient";
import { queryClient } from "../lib/queryClient";
import type { CustomField } from "../types";

function invalidateCustomFields() {
  queryClient.invalidateQueries({ queryKey: ["customFields"] });
}

export async function createCustomField(label: string): Promise<CustomField> {
  const field = await apiFetch<CustomField>("/custom-fields", {
    method: "POST",
    body: JSON.stringify({ label }),
  });
  invalidateCustomFields();
  return field;
}

export async function deleteCustomField(id: string): Promise<void> {
  await apiFetch<void>(`/custom-fields/${id}`, { method: "DELETE" });
  invalidateCustomFields();
  queryClient.invalidateQueries({ queryKey: ["contacts"] });
}
