import Papa from "papaparse";
import type { ImportRow } from "../types";

const FIRST_NAME_KEYS = ["firstname", "first name", "first", "givenname", "given name"];
const LAST_NAME_KEYS = ["lastname", "last name", "last", "surname", "familyname", "family name"];
const FULL_NAME_KEYS = ["fullname", "full name", "name", "contactname", "contact name"];
const PHONE_KEYS = ["phone", "phonenumber", "phone number", "mobile", "mobilenumber", "mobile number", "whatsapp", "whatsappnumber", "cell", "tel"];
const EMAIL_KEYS = ["email", "emailaddress", "email address", "e-mail"];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function findKey(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map((h) => ({ original: h, norm: normalizeHeader(h) }));
  for (const candidate of candidates) {
    const match = normalized.find((h) => h.norm === candidate);
    if (match) return match.original;
  }
  // fallback: partial match
  for (const candidate of candidates) {
    const match = normalized.find((h) => h.norm.includes(candidate));
    if (match) return match.original;
  }
  return undefined;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export interface ParsedImport {
  rows: ImportRow[];
  headers: string[];
  errors: string[];
}

function rowsFromRecords(records: Record<string, string>[]): ParsedImport {
  const errors: string[] = [];
  if (records.length === 0) {
    return { rows: [], headers: [], errors: ["The file appears to be empty."] };
  }
  const headers = Object.keys(records[0]);
  const firstKey = findKey(headers, FIRST_NAME_KEYS);
  const lastKey = findKey(headers, LAST_NAME_KEYS);
  const fullKey = !firstKey ? findKey(headers, FULL_NAME_KEYS) : undefined;
  const phoneKey = findKey(headers, PHONE_KEYS);
  const emailKey = findKey(headers, EMAIL_KEYS);

  if (!phoneKey) {
    errors.push('Could not find a phone number column. Expected a header like "Phone" or "Mobile".');
  }
  if (!firstKey && !fullKey) {
    errors.push('Could not find a name column. Expected a header like "First Name" or "Name".');
  }

  const rows: ImportRow[] = records
    .map((record) => {
      let firstName = firstKey ? String(record[firstKey] ?? "").trim() : "";
      let lastName = lastKey ? String(record[lastKey] ?? "").trim() : "";
      if (!firstName && fullKey) {
        const split = splitFullName(String(record[fullKey] ?? ""));
        firstName = split.firstName;
        lastName = split.lastName;
      }
      const phone = phoneKey ? String(record[phoneKey] ?? "").trim() : "";
      const email = emailKey ? String(record[emailKey] ?? "").trim() : undefined;
      return { firstName, lastName, phone, email, raw: record };
    })
    .filter((r) => r.firstName || r.phone);

  return { rows, headers, errors };
}

export function parseCSV(file: File): Promise<ParsedImport> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        resolve(rowsFromRecords(results.data));
      },
      error: (err: Error) => reject(err),
    });
  });
}

export async function parseExcel(file: File): Promise<ParsedImport> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
  return rowsFromRecords(records);
}

export function parseContactFile(file: File): Promise<ParsedImport> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseCSV(file);
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return parseExcel(file);
  return Promise.reject(new Error("Unsupported file type. Please upload a .csv or .xlsx file."));
}

export function downloadContactTemplate() {
  const csv = "First Name,Last Name,Phone,Email\nJohn,Doe,+2348012345678,john@example.com\nJane,Smith,+2347012345678,\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "contact-import-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
