import { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Input, TextArea } from "./ui/Input";
import { Button } from "./ui/Button";
import { Trash } from "./ui/icons";
import type { Contact, Group } from "../types";
import { createContact, updateContact, deleteContact } from "../db/contacts";
import { formatPhoneDisplay } from "../lib/phone";
import { useToast } from "./ui/Toast";

interface ContactFormModalProps {
  open: boolean;
  onClose: () => void;
  contact?: Contact;
  groups: Group[];
  defaultGroupIds?: string[];
}

export function ContactFormModal({ open, onClose, contact, groups, defaultGroupIds }: ContactFormModalProps) {
  const { show } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFirstName(contact?.firstName ?? "");
      setLastName(contact?.lastName ?? "");
      setPhone(contact ? formatPhoneDisplay(contact.phone) : "");
      setEmail(contact?.email ?? "");
      setNotes(contact?.notes ?? "");
      setGroupIds(contact?.groupIds ?? defaultGroupIds ?? []);
      setError("");
    }
  }, [open, contact, defaultGroupIds]);

  function toggleGroup(id: string) {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  async function handleSave() {
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    setSaving(true);
    try {
      if (contact) {
        await updateContact(contact.id, { firstName, lastName, phone, email, notes, groupIds });
        show("Contact updated", "success");
      } else {
        await createContact({ firstName, lastName, phone, email, notes, groupIds });
        show("Contact added", "success");
      }
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!contact) return;
    if (!confirm(`Remove ${contact.firstName} from your contacts?`)) return;
    await deleteContact(contact.id);
    show("Contact removed");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contact ? "Edit Contact" : "Add Contact"}
      footer={
        <>
          {contact && (
            <Button variant="ghost" onClick={handleDelete} icon={<Trash size={16} />} className="mr-auto">
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
          <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Input
          label="Phone number"
          placeholder="+234 801 234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          hint="Include the country code, e.g. +234 for Nigeria."
        />
        <Input
          label="Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextArea label="Notes (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        {groups.length > 0 && (
          <div>
            <span className="block text-sm font-medium text-ink mb-1.5">Groups</span>
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => {
                const active = groupIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active ? "text-white border-transparent" : "text-ink-muted border-black/10 hover:bg-black/5"
                    }`}
                    style={active ? { backgroundColor: g.color } : undefined}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
