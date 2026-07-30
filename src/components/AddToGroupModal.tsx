import { useState } from "react";
import { Link } from "react-router-dom";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Users } from "./ui/icons";
import { addContactsToGroup } from "../db/contacts";
import { useToast } from "./ui/Toast";
import type { Contact, Group } from "../types";

interface AddToGroupModalProps {
  open: boolean;
  onClose: () => void;
  contactIds: string[];
  allContacts: Contact[];
  groups: Group[];
  excludeGroupId?: string;
}

export function AddToGroupModal({
  open,
  onClose,
  contactIds,
  allContacts,
  groups,
  excludeGroupId,
}: AddToGroupModalProps) {
  const { show } = useToast();
  const [saving, setSaving] = useState(false);

  const options = groups.filter((g) => g.id !== excludeGroupId);

  async function handlePick(group: Group) {
    setSaving(true);
    try {
      await addContactsToGroup(contactIds, group.id, allContacts);
      show(
        `Added ${contactIds.length} contact${contactIds.length === 1 ? "" : "s"} to ${group.name}`,
        "success",
      );
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add ${contactIds.length} contact${contactIds.length === 1 ? "" : "s"} to group`}>
      {options.length === 0 ? (
        <div className="text-center py-6">
          <Users size={26} className="mx-auto text-ink-muted mb-2" />
          <p className="text-sm text-ink-muted mb-4">No groups yet.</p>
          <Link to="/groups">
            <Button size="sm" onClick={onClose}>
              Create a group
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {options.map((g) => (
            <button
              key={g.id}
              disabled={saving}
              onClick={() => handlePick(g)}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-black/5 text-left disabled:opacity-50"
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0"
                style={{ backgroundColor: g.color }}
              >
                {g.name[0]?.toUpperCase()}
              </span>
              <span className="text-sm text-ink flex-1 truncate">{g.name}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
