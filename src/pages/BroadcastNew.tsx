import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useContacts, useGroups, useTemplates, useCustomFields } from "../hooks/useData";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, TextArea } from "../components/ui/Input";
import { Avatar } from "../components/ui/Avatar";
import {
  Search,
  Users,
  Upload,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Send,
  FileSpreadsheet,
} from "../components/ui/icons";
import { personalizeMessage } from "../lib/personalize";
import { parseContactFile, downloadContactTemplate, type ParsedImport } from "../lib/importContacts";
import { normalizePhone, isValidPhoneDigits } from "../lib/phone";
import { createBroadcast, recipientFromContact } from "../db/broadcasts";
import { useToast } from "../components/ui/Toast";
import type { BroadcastRecipient, Contact } from "../types";

type Step = 1 | 2 | 3;
type RecipientTab = "groups" | "contacts" | "upload";

const PLACEHOLDER_CHIPS = ["{{FirstName}}", "{{LastName}}", "{{FullName}}"];

export function BroadcastNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { show } = useToast();
  const contacts = useContacts();
  const groups = useGroups();
  const templates = useTemplates();
  const customFields = useCustomFields();
  const placeholderChips = [...PLACEHOLDER_CHIPS, ...(customFields ?? []).map((f) => `{{${f.key}}}`)];

  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [uploadedRows, setUploadedRows] = useState<BroadcastRecipient[]>([]);
  const [recipientTab, setRecipientTab] = useState<RecipientTab>("groups");
  const [contactQuery, setContactQuery] = useState("");
  const [parsedUpload, setParsedUpload] = useState<ParsedImport | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const groupId = searchParams.get("groupId");
    if (groupId) setSelectedGroupIds([groupId]);
    const templateId = searchParams.get("templateId");
    if (templateId && templates) {
      const t = templates.find((x) => x.id === templateId);
      if (t) setMessageBody(t.body);
    }
  }, [searchParams, templates]);

  const recipients = useMemo<BroadcastRecipient[]>(() => {
    const map = new Map<string, BroadcastRecipient>();
    const groupMembers = (contacts ?? []).filter((c) => c.groupIds.some((g) => selectedGroupIds.includes(g)));
    for (const c of groupMembers) map.set(c.phone, recipientFromContact(c));
    for (const id of selectedContactIds) {
      const c = (contacts ?? []).find((x) => x.id === id);
      if (c) map.set(c.phone, recipientFromContact(c));
    }
    for (const r of uploadedRows) map.set(r.phone, r);
    return Array.from(map.values());
  }, [contacts, selectedGroupIds, selectedContactIds, uploadedRows]);

  const filteredContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    if (!q) return contacts ?? [];
    return (contacts ?? []).filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q));
  }, [contacts, contactQuery]);

  function toggleGroup(id: string) {
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  function toggleContact(c: Contact) {
    setSelectedContactIds((prev) => (prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]));
  }

  async function handleUploadFile(file: File) {
    setUploadError("");
    try {
      const result = await parseContactFile(file);
      setParsedUpload(result);
      if (result.errors.length === 0) {
        const asRecipients: BroadcastRecipient[] = result.rows
          .map((r) => ({ ...r, phone: normalizePhone(r.phone) }))
          .filter((r) => r.firstName && isValidPhoneDigits(r.phone))
          .map((r) => ({
            firstName: r.firstName,
            lastName: r.lastName ?? "",
            phone: r.phone,
            status: "pending" as const,
          }));
        setUploadedRows(asRecipients);
      }
    } catch (err) {
      setUploadError((err as Error).message);
    }
  }

  function insertPlaceholder(token: string) {
    setMessageBody((prev) => `${prev}${prev && !prev.endsWith(" ") && !prev.endsWith("\n") ? " " : ""}${token}`);
  }

  const currentPreviewRecipient = recipients[previewIndex] ?? recipients[0];

  async function handleSave(startNow: boolean) {
    if (!title.trim() || recipients.length === 0 || !messageBody.trim()) return;
    setSaving(true);
    try {
      const broadcast = await createBroadcast(
        {
          title,
          messageBody,
          recipients,
          sourceGroupIds: selectedGroupIds,
        },
        startNow ? "active" : "draft",
      );
      show(startNow ? "Broadcast started" : "Draft saved", "success");
      navigate(startNow ? `/broadcasts/${broadcast.id}/run` : `/broadcasts/${broadcast.id}`);
    } finally {
      setSaving(false);
    }
  }

  const canGoStep2 = title.trim().length > 0 && recipients.length > 0;
  const canGoStep3 = messageBody.trim().length > 0;

  return (
    <div>
      <PageHeader title="New Broadcast" back />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 pb-28">
        <StepIndicator step={step} />

        {step === 1 && (
          <div className="flex flex-col gap-5 mt-5">
            <Input
              label="Broadcast title"
              placeholder="e.g. Sunday Service Reminder"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />

            <div>
              <span className="block text-sm font-medium text-ink mb-2">Recipients</span>
              <div className="flex gap-1.5 mb-3 bg-black/5 rounded-xl p-1 w-fit">
                {(
                  [
                    ["groups", "Groups", Users],
                    ["contacts", "Contacts", Users],
                    ["upload", "Upload", Upload],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setRecipientTab(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      recipientTab === key ? "bg-white shadow-sm text-brand-dark" : "text-ink-muted"
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>

              {recipientTab === "groups" && (
                <div className="flex flex-wrap gap-2">
                  {(groups ?? []).length === 0 && (
                    <p className="text-sm text-ink-muted">No groups yet. Create one from the Groups tab.</p>
                  )}
                  {groups?.map((g) => {
                    const active = selectedGroupIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
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
              )}

              {recipientTab === "contacts" && (
                <div>
                  <div className="relative mb-2">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      value={contactQuery}
                      onChange={(e) => setContactQuery(e.target.value)}
                      placeholder="Search contacts"
                      className="w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto rounded-xl border border-black/5">
                    {filteredContacts.map((c) => {
                      const active = selectedContactIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleContact(c)}
                          className={`flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-black/5 ${
                            active ? "bg-brand-pale/40" : ""
                          }`}
                        >
                          <Avatar name={`${c.firstName} ${c.lastName}`} size={30} />
                          <span className="text-sm text-ink flex-1 truncate">
                            {c.firstName} {c.lastName}
                          </span>
                          {active && <Check size={16} className="text-brand-dark shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {recipientTab === "upload" && (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={downloadContactTemplate}
                    className="flex items-center gap-2 text-xs font-medium text-brand-dark bg-brand-pale rounded-lg px-3 py-2 w-fit"
                  >
                    <FileSpreadsheet size={14} />
                    Download template
                  </button>
                  <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-black/15 rounded-2xl py-8 cursor-pointer hover:border-black/25">
                    <Upload size={22} className="text-ink-muted" />
                    <span className="text-sm text-ink font-medium">Upload CSV or Excel</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadFile(f);
                      }}
                    />
                  </label>
                  {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
                  {parsedUpload && parsedUpload.errors.map((e, i) => (
                    <p key={i} className="text-xs text-danger">
                      {e}
                    </p>
                  ))}
                  {uploadedRows.length > 0 && (
                    <p className="text-sm text-ink">
                      <span className="font-semibold">{uploadedRows.length}</span> recipients loaded from file.
                    </p>
                  )}
                </div>
              )}
            </div>

            <Card className="p-3.5 flex items-center justify-between">
              <span className="text-sm text-ink-muted">Total recipients selected</span>
              <span className="text-lg font-bold text-brand-dark">{recipients.length}</span>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 mt-5">
            {templates && templates.length > 0 && (
              <div>
                <span className="block text-sm font-medium text-ink mb-2">Start from a template (optional)</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setMessageBody(t.body)}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-black/10 text-ink-muted hover:bg-black/5"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <TextArea
              label="Message"
              rows={7}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder={"Hi {{FirstName}},\n\nJust a reminder that..."}
            />

            <div>
              <span className="flex items-center gap-1 text-xs font-medium text-ink-muted mb-1.5">
                <Sparkles size={13} /> Insert placeholder
              </span>
              <div className="flex flex-wrap gap-2">
                {placeholderChips.map((p) => (
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

            {recipients.length > 0 && messageBody && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-ink-muted">
                    Preview for {currentPreviewRecipient?.firstName}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                      className="p-1 rounded-full hover:bg-black/5 text-ink-muted disabled:opacity-30"
                      disabled={previewIndex === 0}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs text-ink-muted">
                      {previewIndex + 1}/{recipients.length}
                    </span>
                    <button
                      onClick={() => setPreviewIndex((i) => Math.min(recipients.length - 1, i + 1))}
                      className="p-1 rounded-full hover:bg-black/5 text-ink-muted disabled:opacity-30"
                      disabled={previewIndex === recipients.length - 1}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl bg-chat-bg p-4">
                  <div className="bg-brand-pale rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%] ml-auto shadow-sm">
                    <p className="text-sm text-ink whitespace-pre-line">
                      {currentPreviewRecipient
                        ? personalizeMessage(messageBody, currentPreviewRecipient)
                        : messageBody}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 mt-5">
            <Card className="p-4">
              <p className="text-sm font-semibold text-ink mb-1">{title}</p>
              <p className="text-xs text-ink-muted">{recipients.length} recipients · Manual send via WhatsApp</p>
            </Card>
            <div>
              <span className="block text-sm font-medium text-ink mb-2">Recipients</span>
              <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto rounded-xl border border-black/5">
                {recipients.map((r, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 border-b border-black/5 last:border-0">
                    <Avatar name={`${r.firstName} ${r.lastName}`} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink truncate">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="text-xs text-ink-muted truncate">
                        {personalizeMessage(messageBody, r).slice(0, 60)}
                        {personalizeMessage(messageBody, r).length > 60 ? "…" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 sm:left-60 bg-white border-t border-black/5 px-4 sm:px-6 py-3 flex gap-2 safe-bottom">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)}>
            Back
          </Button>
        )}
        <div className="flex-1" />
        {step < 3 && (
          <Button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={step === 1 ? !canGoStep2 : !canGoStep3}
            icon={<ChevronRight size={16} />}
          >
            Continue
          </Button>
        )}
        {step === 3 && (
          <>
            <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
              Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving} icon={<Send size={15} />}>
              Start Broadcast
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = ["Details", "Message", "Review"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const n = (i + 1) as Step;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                active ? "bg-brand-dark text-white" : done ? "bg-brand-pale text-brand-dark" : "bg-black/5 text-ink-muted"
              }`}
            >
              {done ? <Check size={14} /> : n}
            </div>
            <span className={`text-xs font-medium ${active ? "text-ink" : "text-ink-muted"}`}>{label}</span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-black/10" />}
          </div>
        );
      })}
    </div>
  );
}
