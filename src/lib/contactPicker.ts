import type { ImportRow } from "../types";

interface ContactsManagerLike {
  select: (
    properties: string[],
    options?: { multiple?: boolean },
  ) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>>;
}

function getContactsManager(): ContactsManagerLike | undefined {
  return (navigator as unknown as { contacts?: ContactsManagerLike }).contacts;
}

export function isContactPickerSupported(): boolean {
  return typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window;
}

export async function pickDeviceContacts(): Promise<ImportRow[]> {
  const manager = getContactsManager();
  if (!manager) throw new Error("Contact picker is not supported on this device/browser.");

  const props = ["name", "tel", "email"];
  const results = await manager.select(props, { multiple: true });

  return results.map((r) => {
    const fullName = r.name?.[0]?.trim() ?? "";
    const parts = fullName.split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ");
    return {
      firstName,
      lastName,
      phone: r.tel?.[0] ?? "",
      email: r.email?.[0],
    };
  });
}
