import { useEffect, useRef, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Select } from "./ui/Input";
import { Download, Upload, FileSpreadsheet } from "./ui/icons";
import type { Group } from "../types";
import { parseContactFile, downloadContactTemplate, type ParsedImport } from "../lib/importContacts";
import { importContacts } from "../db/contacts";
import { createCustomField } from "../db/customFields";
import { useCustomFields } from "../hooks/useData";
import { useToast } from "./ui/Toast";
import { isContactPickerSupported, pickDeviceContacts } from "../lib/contactPicker";
import { ContactImport } from "./ui/icons";

interface ImportContactsModalProps {
  open: boolean;
  onClose: () => void;
  groups: Group[];
  /** When set, every imported row (new or updated) is locked into this group. */
  lockGroupId?: string;
  lockGroupName?: string;
}

type ColumnMapping = { action: "ignore" | "existing" | "new"; targetKey?: string };

const IGNORE = "ignore";
const NEW = "new";

export function ImportContactsModal({ open, onClose, groups, lockGroupId, lockGroupName }: ImportContactsModalProps) {
  const { show } = useToast();
  const customFields = useCustomFields();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, ColumnMapping>>({});
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (open) setSelectedGroupIds(lockGroupId ? [lockGroupId] : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lockGroupId]);

  useEffect(() => {
    if (!parsed) return;
    setColumnMap((prev) => {
      const next = { ...prev };
      for (const header of parsed.extraHeaders) {
        if (next[header]) continue;
        const autoMatch = customFields?.find((f) => f.label.toLowerCase() === header.trim().toLowerCase());
        next[header] = autoMatch ? { action: "existing", targetKey: autoMatch.key } : { action: "ignore" };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed]);

  function reset() {
    setFile(null);
    setParsed(null);
    setSelectedGroupIds(lockGroupId ? [lockGroupId] : []);
    setColumnMap({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(f: File) {
    setFile(f);
    try {
      const result = await parseContactFile(f);
      setParsed(result);
    } catch (err) {
      setParsed({ rows: [], headers: [], extraHeaders: [], errors: [(err as Error).message] });
    }
  }

  async function handleDevicePick() {
    try {
      const rows = await pickDeviceContacts();
      if (rows.length === 0) return;
      setFile(new File([], "Phone contacts"));
      setParsed({ rows, headers: [], extraHeaders: [], errors: [] });
    } catch (err) {
      show((err as Error).message, "danger");
    }
  }

  function toggleGroup(id: string) {
    if (id === lockGroupId) return;
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  function setMapping(header: string, value: string) {
    if (value === IGNORE) {
      setColumnMap((prev) => ({ ...prev, [header]: { action: "ignore" } }));
    } else if (value === NEW) {
      setColumnMap((prev) => ({ ...prev, [header]: { action: "new" } }));
    } else {
      setColumnMap((prev) => ({ ...prev, [header]: { action: "existing", targetKey: value } }));
    }
  }

  async function handleImport() {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    try {
      const resolvedKeys: Record<string, string> = {};
      for (const header of parsed.extraHeaders) {
        const mapping = columnMap[header];
        if (!mapping || mapping.action === "ignore") continue;
        if (mapping.action === "existing" && mapping.targetKey) {
          resolvedKeys[header] = mapping.targetKey;
        } else if (mapping.action === "new") {
          const field = await createCustomField(header);
          resolvedKeys[header] = field.key;
        }
      }

      const rows = parsed.rows.map((r) => {
        const customData: Record<string, string> = {};
        for (const [header, key] of Object.entries(resolvedKeys)) {
          const value = r.raw?.[header]?.trim();
          if (value) customData[key] = value;
        }
        return { ...r, customData };
      });

      const result = await importContacts(rows, selectedGroupIds);
      const parts = [`${result.created} new`];
      if (result.updated > 0) parts.push(`${result.updated} updated`);
      if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
      show(`Imported: ${parts.join(" · ")}`, "success");
      handleClose();
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={lockGroupName ? `Import to ${lockGroupName}` : "Import Contacts"}
      footer={
        parsed && parsed.rows.length > 0 ? (
          <>
            <Button variant="outline" onClick={reset}>
              Choose different file
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importing..." : `Import ${parsed.rows.length} contacts`}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">
          {lockGroupName ? (
            <>
              Upload a CSV or Excel file — every contact in it will be added to <strong>{lockGroupName}</strong>.
            </>
          ) : (
            "Upload a CSV or Excel file with your contacts."
          )}{" "}
          Not sure of the format?
        </p>
        <button
          type="button"
          onClick={downloadContactTemplate}
          className="flex items-center gap-2 text-sm font-medium text-brand-dark bg-brand-pale rounded-xl px-3.5 py-2.5 w-fit hover:bg-[#c9edb0] transition-colors"
        >
          <Download size={16} />
          Download template
        </button>

        {!file && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-10 px-4 cursor-pointer transition-colors ${
                dragActive ? "border-brand-light bg-brand-pale/40" : "border-black/15 hover:border-black/25"
              }`}
            >
              <Upload size={26} className="text-ink-muted" />
              <p className="text-sm font-medium text-ink">Tap to upload or drag a file here</p>
              <p className="text-xs text-ink-muted">.CSV or .XLSX</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
            {isContactPickerSupported() && (
              <Button variant="outline" icon={<ContactImport size={16} />} onClick={handleDevicePick}>
                Choose from phone contacts
              </Button>
            )}
          </>
        )}

        {file && parsed && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-surface-muted px-3.5 py-2.5">
              <FileSpreadsheet size={18} className="text-brand-dark shrink-0" />
              <span className="text-sm text-ink truncate">{file.name}</span>
            </div>

            {parsed.errors.length > 0 && (
              <div className="rounded-xl bg-red-50 px-3.5 py-2.5">
                {parsed.errors.map((e, i) => (
                  <p key={i} className="text-xs text-danger">
                    {e}
                  </p>
                ))}
              </div>
            )}

            {parsed.rows.length > 0 && (
              <>
                <p className="text-sm text-ink">
                  Found <span className="font-semibold">{parsed.rows.length}</span> contact
                  {parsed.rows.length === 1 ? "" : "s"} ready to import. Existing contacts (matched by phone) will be
                  updated rather than duplicated.
                </p>
                <div className="rounded-xl border border-black/5 divide-y divide-black/5 max-h-40 overflow-y-auto">
                  {parsed.rows.slice(0, 5).map((r, i) => (
                    <div key={i} className="px-3.5 py-2 text-sm flex justify-between">
                      <span className="text-ink">
                        {r.firstName} {r.lastName}
                      </span>
                      <span className="text-ink-muted">{r.phone}</span>
                    </div>
                  ))}
                  {parsed.rows.length > 5 && (
                    <div className="px-3.5 py-2 text-xs text-ink-muted">
                      + {parsed.rows.length - 5} more
                    </div>
                  )}
                </div>

                {parsed.extraHeaders.length > 0 && (
                  <div>
                    <span className="block text-sm font-medium text-ink mb-1.5">
                      Map extra columns to mail merge tags (optional)
                    </span>
                    <div className="flex flex-col gap-2">
                      {parsed.extraHeaders.map((header) => {
                        const mapping = columnMap[header] ?? { action: "ignore" as const };
                        const value =
                          mapping.action === "existing" && mapping.targetKey ? mapping.targetKey : mapping.action;
                        return (
                          <div key={header} className="flex items-center gap-2">
                            <span className="text-sm text-ink w-28 truncate shrink-0" title={header}>
                              {header}
                            </span>
                            <Select
                              value={value}
                              onChange={(e) => setMapping(header, e.target.value)}
                              className="flex-1"
                            >
                              <option value={IGNORE}>Don't import</option>
                              {customFields?.map((f) => (
                                <option key={f.id} value={f.key}>
                                  {f.label} — {`{{${f.key}}}`}
                                </option>
                              ))}
                              <option value={NEW}>+ Create new tag "{header}"</option>
                            </Select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {groups.length > 0 && (
                  <div>
                    <span className="block text-sm font-medium text-ink mb-1.5">
                      {lockGroupId ? "Also add to another group (optional)" : "Add to group (optional)"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {lockGroupId && (
                        <span
                          className="px-3 py-1.5 rounded-full text-xs font-medium text-white border border-transparent opacity-90 cursor-default"
                          style={{ backgroundColor: groups.find((g) => g.id === lockGroupId)?.color }}
                        >
                          {lockGroupName} (locked)
                        </span>
                      )}
                      {groups
                        .filter((g) => g.id !== lockGroupId)
                        .map((g) => {
                          const active = selectedGroupIds.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => toggleGroup(g.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                active
                                  ? "text-white border-transparent"
                                  : "text-ink-muted border-black/10 hover:bg-black/5"
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
                {lockGroupId && groups.length === 0 && (
                  <p className="text-xs text-ink-muted">Every contact in this file will be added to {lockGroupName}.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
