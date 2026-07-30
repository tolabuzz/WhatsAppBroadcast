import { apiFetch } from "../lib/apiClient";
import { queryClient } from "../lib/queryClient";
import type { MessageTemplate, TemplateCategory } from "../types";

export interface TemplateInput {
  name: string;
  category: TemplateCategory;
  body: string;
}

function invalidateTemplates() {
  queryClient.invalidateQueries({ queryKey: ["templates"] });
}

export async function createTemplate(input: TemplateInput): Promise<MessageTemplate> {
  const template = await apiFetch<MessageTemplate>("/templates", {
    method: "POST",
    body: JSON.stringify(input),
  });
  invalidateTemplates();
  return template;
}

export async function updateTemplate(id: string, input: Partial<TemplateInput>): Promise<void> {
  await apiFetch<MessageTemplate>(`/templates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  invalidateTemplates();
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiFetch<void>(`/templates/${id}`, { method: "DELETE" });
  invalidateTemplates();
}
