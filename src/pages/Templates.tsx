import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTemplates } from "../hooks/useData";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Input, TextArea, Select } from "../components/ui/Input";
import { Plus, MessageSquare, Trash, Edit, Send, Sparkles } from "../components/ui/icons";
import { createTemplate, updateTemplate, deleteTemplate } from "../db/templates";
import { personalizeMessage } from "../lib/personalize";
import { useToast } from "../components/ui/Toast";
import type { MessageTemplate, TemplateCategory } from "../types";

const CATEGORIES: TemplateCategory[] = [
  "General",
  "Birthday",
  "Event Reminder",
  "Prayer Alert",
  "Follow-up",
  "Meeting Reminder",
  "Appreciation",
];

const PLACEHOLDER_CHIPS = ["{{FirstName}}", "{{LastName}}", "{{FullName}}"];

export function Templates() {
  const templates = useTemplates();
  const navigate = useNavigate();
  const { show } = useToast();

  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("General");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setName("");
    setCategory("General");
    setBody("");
    setShowForm(true);
  }

  function openEdit(t: MessageTemplate) {
    setEditing(t);
    setName(t.name);
    setCategory(t.category);
    setBody(t.body);
    setShowForm(true);
  }

  function insertPlaceholder(token: string) {
    setBody((prev) => `${prev}${prev && !prev.endsWith(" ") && !prev.endsWith("\n") ? " " : ""}${token}`);
  }

  async function handleSave() {
    if (!name.trim() || !body.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateTemplate(editing.id, { name, category, body });
        show("Template updated", "success");
      } else {
        await createTemplate({ name, category, body });
        show("Template saved", "success");
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: MessageTemplate) {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    await deleteTemplate(t.id);
    show("Template deleted");
  }

  return (
    <div>
      <PageHeader
        title="Templates"
        subtitle={templates ? `${templates.length} saved` : undefined}
        actions={
          <Button size="sm" icon={<Plus size={15} />} onClick={openNew}>
            New
          </Button>
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        {templates && templates.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={26} />}
            title="No templates yet"
            description="Save reusable messages like meeting reminders or birthday wishes with personalization placeholders."
            action={
              <Button icon={<Plus size={15} />} onClick={openNew}>
                Create Template
              </Button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {templates?.map((t) => (
              <Card key={t.id} className="p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm text-ink truncate">{t.name}</h3>
                  <Badge>{t.category}</Badge>
                </div>
                <p className="text-sm text-ink-muted whitespace-pre-line line-clamp-3 mb-3 flex-1">{t.body}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Send size={13} />}
                    onClick={() => navigate(`/broadcasts/new?templateId=${t.id}`)}
                  >
                    Use
                  </Button>
                  <Button size="sm" variant="outline" icon={<Edit size={13} />} onClick={() => openEdit(t)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash size={13} />}
                    onClick={() => handleDelete(t)}
                    className="text-danger ml-auto"
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? "Edit Template" : "New Template"}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim() || !body.trim()}>
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Input label="Template name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as TemplateCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <TextArea
            label="Message"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Hi {{FirstName}}, ..."
          />
          <div>
            <span className="flex items-center gap-1 text-xs font-medium text-ink-muted mb-1.5">
              <Sparkles size={13} /> Insert placeholder
            </span>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDER_CHIPS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => insertPlaceholder(p)}
                  className="px-2.5 py-1 rounded-full text-xs font-mono bg-brand-pale text-brand-dark hover:bg-[#c9edb0]"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {body && (
            <div className="rounded-xl bg-chat-bg px-3.5 py-2.5">
              <p className="text-[11px] font-medium text-ink-muted mb-1">Preview</p>
              <p className="text-sm text-ink whitespace-pre-line">
                {personalizeMessage(body, { firstName: "John", lastName: "Doe" })}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
