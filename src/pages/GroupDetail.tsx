import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useContactsInGroup, useContacts } from "../hooks/useData";
import { db } from "../db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Users, Plus, Trash, Send, X } from "../components/ui/icons";
import { renameGroup, deleteGroup } from "../db/groups";
import { addContactsToGroup, removeContactFromGroup } from "../db/contacts";
import { formatPhoneDisplay } from "../lib/phone";
import { useToast } from "../components/ui/Toast";

export function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const group = useLiveQuery(() => (id ? db.groups.get(id) : undefined), [id]);
  const members = useContactsInGroup(id);
  const allContacts = useContacts();

  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState("");
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [query, setQuery] = useState("");

  const nonMembers = useMemo(() => {
    const memberIds = new Set((members ?? []).map((m) => m.id));
    return (allContacts ?? []).filter((c) => !memberIds.has(c.id));
  }, [allContacts, members]);

  const filteredNonMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nonMembers;
    return nonMembers.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q));
  }, [nonMembers, query]);

  if (!group) {
    return (
      <div>
        <PageHeader title="Group" back />
      </div>
    );
  }

  async function handleDeleteGroup() {
    if (!confirm(`Delete "${group!.name}"? Contacts will remain, but will be removed from this group.`)) return;
    await deleteGroup(group!.id);
    show("Group deleted");
    navigate("/groups");
  }

  async function handleRename() {
    if (!newName.trim()) return;
    await renameGroup(group!.id, newName);
    setShowRename(false);
    show("Group renamed", "success");
  }

  return (
    <div>
      <PageHeader
        title={group.name}
        subtitle={`${members?.length ?? 0} contacts`}
        back
        actions={
          <Button size="sm" variant="outline" onClick={() => navigate(`/broadcasts/new?groupId=${group.id}`)} icon={<Send size={14} />}>
            Broadcast
          </Button>
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus size={14} />}
            onClick={() => {
              setShowAddExisting(true);
              setQuery("");
            }}
          >
            Add contacts
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setNewName(group.name);
              setShowRename(true);
            }}
          >
            Rename
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDeleteGroup} icon={<Trash size={14} />} className="text-danger ml-auto">
            Delete
          </Button>
        </div>

        {members && members.length === 0 ? (
          <EmptyState
            icon={<Users size={26} />}
            title="No contacts in this group"
            description="Add existing contacts or import new ones directly into this group."
            action={
              <Button icon={<Plus size={15} />} onClick={() => setShowAddExisting(true)}>
                Add Contacts
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-1">
            {members?.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-black/5">
                <Avatar name={`${c.firstName} ${c.lastName}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-xs text-ink-muted truncate">{formatPhoneDisplay(c.phone)}</p>
                </div>
                <button
                  onClick={() => removeContactFromGroup(c.id, group.id)}
                  className="p-1.5 rounded-full hover:bg-black/10 text-ink-muted shrink-0"
                  aria-label="Remove from group"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showRename}
        onClose={() => setShowRename(false)}
        title="Rename Group"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowRename(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </>
        }
      >
        <Input label="Group name" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
      </Modal>

      <Modal open={showAddExisting} onClose={() => setShowAddExisting(false)} title="Add Contacts to Group">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts"
          className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-light"
          autoFocus
        />
        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
          {filteredNonMembers.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-6">No matching contacts.</p>
          )}
          {filteredNonMembers.map((c) => (
            <button
              key={c.id}
              onClick={async () => {
                await addContactsToGroup([c.id], group.id);
                show(`Added ${c.firstName}`, "success");
              }}
              className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-black/5 text-left"
            >
              <Avatar name={`${c.firstName} ${c.lastName}`} size={32} />
              <span className="text-sm text-ink flex-1 truncate">
                {c.firstName} {c.lastName}
              </span>
              <Plus size={16} className="text-brand-dark shrink-0" />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
