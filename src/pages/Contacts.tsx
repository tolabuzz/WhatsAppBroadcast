import { useMemo, useState } from "react";
import { useContacts, useGroups } from "../hooks/useData";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { ContactFormModal } from "../components/ContactFormModal";
import { ImportContactsModal } from "../components/ImportContactsModal";
import { Search, Plus, Upload, Users } from "../components/ui/icons";
import { formatPhoneDisplay } from "../lib/phone";
import type { Contact } from "../types";

export function Contacts() {
  const contacts = useContacts();
  const groups = useGroups();
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    if (!contacts) return [];
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (groupFilter && !c.groupIds.includes(groupFilter)) return false;
      if (!q) return true;
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      return name.includes(q) || c.phone.includes(q.replace(/\D/g, ""));
    });
  }, [contacts, query, groupFilter]);

  const groupsById = useMemo(() => {
    const map = new Map((groups ?? []).map((g) => [g.id, g]));
    return map;
  }, [groups]);

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={contacts ? `${contacts.length} total` : undefined}
        actions={
          <>
            <Button size="sm" variant="outline" icon={<Upload size={15} />} onClick={() => setShowImport(true)}>
              Import
            </Button>
            <Button size="sm" icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
              Add
            </Button>
          </>
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <div className="relative mb-3">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts by name or phone"
            className="w-full rounded-xl border border-black/10 bg-white pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent"
          />
        </div>

        {groups && groups.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setGroupFilter(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                groupFilter === null
                  ? "bg-brand-dark text-white border-transparent"
                  : "text-ink-muted border-black/10 hover:bg-black/5"
              }`}
            >
              All
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setGroupFilter(g.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  groupFilter === g.id ? "text-white border-transparent" : "text-ink-muted border-black/10 hover:bg-black/5"
                }`}
                style={groupFilter === g.id ? { backgroundColor: g.color } : undefined}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {contacts && contacts.length === 0 ? (
          <EmptyState
            icon={<Users size={26} />}
            title="No contacts yet"
            description="Import a CSV/Excel file or add your first contact to get started."
            action={
              <div className="flex gap-2">
                <Button variant="outline" icon={<Upload size={15} />} onClick={() => setShowImport(true)}>
                  Import
                </Button>
                <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
                  Add Contact
                </Button>
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-ink-muted py-10">No contacts match your search.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setEditingContact(c)}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-black/5 text-left transition-colors"
              >
                <Avatar name={`${c.firstName} ${c.lastName}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-xs text-ink-muted truncate">{formatPhoneDisplay(c.phone)}</p>
                </div>
                {c.groupIds.length > 0 && (
                  <div className="hidden sm:flex gap-1 shrink-0">
                    {c.groupIds.slice(0, 2).map((gid) => {
                      const g = groupsById.get(gid);
                      if (!g) return null;
                      return (
                        <span
                          key={gid}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: g.color }}
                        >
                          {g.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <ContactFormModal open={showAdd} onClose={() => setShowAdd(false)} groups={groups ?? []} />
      <ContactFormModal
        open={!!editingContact}
        onClose={() => setEditingContact(null)}
        contact={editingContact ?? undefined}
        groups={groups ?? []}
      />
      <ImportContactsModal open={showImport} onClose={() => setShowImport(false)} groups={groups ?? []} />
    </div>
  );
}
