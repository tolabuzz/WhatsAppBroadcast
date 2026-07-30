export interface PersonalizationFields {
  firstName: string;
  lastName: string;
}

const PLACEHOLDER_PATTERN = /\{\{\s*(\w+)\s*\}\}/g;

export function buildFieldMap(fields: PersonalizationFields): Record<string, string> {
  const fullName = [fields.firstName, fields.lastName].filter(Boolean).join(" ").trim();
  return {
    FirstName: fields.firstName || "",
    LastName: fields.lastName || "",
    FullName: fullName || fields.firstName || "",
  };
}

export function personalizeMessage(template: string, fields: PersonalizationFields): string {
  const map = buildFieldMap(fields);
  return template.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    return key in map ? map[key] : match;
  });
}

export const SUPPORTED_PLACEHOLDERS = ["FirstName", "LastName", "FullName"] as const;

export function extractPlaceholders(template: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(PLACEHOLDER_PATTERN);
  while ((m = re.exec(template))) {
    found.add(m[1]);
  }
  return Array.from(found);
}
