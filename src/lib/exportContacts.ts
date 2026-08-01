import Papa from "papaparse";
import type { Contact, CustomField } from "../types";
import { formatPhoneDisplay } from "./phone";

export function exportContactsToCSV(contacts: Contact[], customFields: CustomField[], filenameHint?: string) {
  const rows = contacts.map((c) => {
    const row: Record<string, string> = {
      "First Name": c.firstName,
      "Last Name": c.lastName,
      Phone: formatPhoneDisplay(c.phone),
      Email: c.email ?? "",
    };
    for (const field of customFields) {
      row[field.label] = c.customData?.[field.key] ?? "";
    }
    return row;
  });

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const datePart = new Date().toISOString().slice(0, 10);
  a.download = `contacts${filenameHint ? `-${filenameHint}` : ""}-${datePart}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
