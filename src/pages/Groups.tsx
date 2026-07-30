import { useState } from "react";
import { Link } from "react-router-dom";
import { useGroups, useContacts } from "../hooks/useData";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Plus, Users, ChevronRight } from "../components/ui/icons";
import { createGroup } from "../db/groups";
import { useToast } from "../components/ui/Toast";

export function Groups() {
  const groups = useGroups();
  const contacts = useContacts();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  function countInGroup(groupId: string) {
    return (contacts ?? []).filter((c) => c.groupIds.includes(groupId)).length;
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createGroup(name);
      show("Group created", "success");
      setName("");
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Groups"
        subtitle={groups ? `${groups.length} groups` : undefined}
        actions={
          <Button size="sm" icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
            New Group
          </Button>
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        {groups && groups.length === 0 ? (
          <EmptyState
            icon={<Users size={26} />}
            title="No groups yet"
            description="Create groups like Workers, Leaders, or Zone A to organize your contacts."
            action={
              <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
                Create Group
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {groups?.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`}>
                <Card className="p-4 flex items-center gap-3 hover:border-brand-light/50 transition-colors">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shrink-0"
                    style={{ backgroundColor: g.color }}
                  >
                    {g.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{g.name}</p>
                    <p className="text-xs text-ink-muted">{countInGroup(g.id)} contacts</p>
                  </div>
                  <ChevronRight size={18} className="text-ink-muted shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="New Group"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>
              Create
            </Button>
          </>
        }
      >
        <Input
          label="Group name"
          placeholder="e.g. Zone A, Volunteers, Executives"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
      </Modal>
    </div>
  );
}
