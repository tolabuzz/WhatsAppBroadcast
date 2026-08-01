import { useMemo, useState } from "react";
import { useContacts, useGroups, useCustomFields } from "../hooks/useData";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { ContactFormModal } from "../components/ContactFormModal";
import { ImportContactsModal } from "../components/ImportContactsModal";
import { AddToGroupModal } from "../components/AddToGroupModal";
import { Search, Plus, Upload, Download, Users, CheckSquare, Check, X, Trash } from "../components/ui/icons";
import { formatPhoneDisplay } from "../lib/phone";
import { deleteContacts } from "../db/contacts";
import { exportContactsToCSV } from "../lib/exportContacts";
import { useToast } from "../components/ui/Toast";
import type { Contact } from "../types";

export function Contacts() {
  const contacts = useContacts();
  const groups = useGroups();
  const customFields = useCustomFields();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddToGroup, setShowAddToGroup] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleRowClick(c: Contact) {
    if (selectMode) {
      toggleSelected(c.id);
    } else {
      setEditingContact(c);
    }
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const c of filtered) next.delete(c.id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const c of filtered) next.add(c.id);
        return next;
      });
    }
  }

  function handleExport() {
    const activeGroup = groupFilter ? groupsById.get(groupFilter) : undefined;
    exportContactsToCSV(filtered, customFields ?? [], activeGroup?.name);
  }

  async function handleDeleteSelected() {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!confirm(`Delete ${count} contact${count === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteContacts(Array.from(selectedIds));
      show(`Deleted ${count} contact${count === 1 ? "" : "s"}`, "success");
      exitSelectMode();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={selectMode ? `${selectedIds.size} selected` : "Contacts"}
        subtitle={!selectMode && contacts ? `${contacts.length} total` : undefined}
        actions={
          selectMode ? (
            <Button size="sm" variant="ghost" icon={<X size={15} />} onClick={exitSelectMode}>
              Cancel
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" icon={<CheckSquare size={15} />} onClick={() => setSelectMode(true)}>
                Select
              </Button>
              <Button size="sm" variant="outline" icon={<Upload size={15} />} onClick={() => setShowImport(true)}>
                Import
              </Button>
              <Button size="sm" icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
                Add
              </Button>
            </>
          )
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-24">
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

        {!selectMode && filtered.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2 py-1.5 mb-3 -mt-1 text-xs font-medium text-ink-muted hover:bg-black/5 hover:text-ink rounded-lg w-fit"
          >
            <Download size={13} />
            Export {groupFilter ? groupsById.get(groupFilter)?.name : `all ${filtered.length}`}
            {groupFilter ? ` (${filtered.length})` : ""}
          </button>
        )}

        {selectMode && filtered.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-2 py-1.5 mb-2 text-xs font-medium text-brand-dark hover:bg-black/5 rounded-lg w-fit"
          >
            <span
              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                allFilteredSelected ? "bg-brand-dark border-brand-dark text-white" : "border-black/20 text-transparent"
              }`}
            >
              <Check size={11} />
            </span>
            {allFilteredSelected ? "Deselect all" : `Select all (${filtered.length})`}
          </button>
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
            {filtered.map((c) => {
              const isSelected = selectedIds.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => handleRowClick(c)}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-black/5 text-left transition-colors ${
                    isSelected ? "bg-brand-pale/40" : ""
                  }`}
                >
                  {selectMode && (
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        isSelected ? "bg-brand-dark border-brand-dark text-white" : "border-black/20 text-transparent"
                      }`}
                    >
                      <Check size={13} />
                    </span>
                  )}
                  <Avatar name={`${c.firstName} ${c.lastName}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-ink-muted truncate">{formatPhoneDisplay(c.phone)}</p>
                  </div>
                  {!selectMode && c.groupIds.length > 0 && (
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
              );
            })}
          </div>
        )}
      </div>

      {selectMode && (
        <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 sm:left-60 bg-white border-t border-black/5 px-4 sm:px-6 py-3 flex justify-end gap-2 safe-bottom">
          <Button
            variant="outline"
            icon={<Trash size={15} />}
            disabled={selectedIds.size === 0 || deleting}
            onClick={handleDeleteSelected}
            className="text-danger"
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
          <Button
            icon={<Users size={15} />}
            disabled={selectedIds.size === 0}
            onClick={() => setShowAddToGroup(true)}
          >
            Add to Group{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </Button>
        </div>
      )}

      <ContactFormModal open={showAdd} onClose={() => setShowAdd(false)} groups={groups ?? []} />
      <ContactFormModal
        open={!!editingContact}
        onClose={() => setEditingContact(null)}
        contact={editingContact ?? undefined}
        groups={groups ?? []}
      />
      <ImportContactsModal open={showImport} onClose={() => setShowImport(false)} groups={groups ?? []} />
      <AddToGroupModal
        open={showAddToGroup}
        onClose={() => {
          setShowAddToGroup(false);
          exitSelectMode();
        }}
        contactIds={Array.from(selectedIds)}
        allContacts={contacts ?? []}
        groups={groups ?? []}
      />
    </div>
  );
}
