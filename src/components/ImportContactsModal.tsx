import { useRef, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Download, Upload, FileSpreadsheet } from "./ui/icons";
import type { Group } from "../types";
import { parseContactFile, downloadContactTemplate, type ParsedImport } from "../lib/importContacts";
import { importContacts } from "../db/contacts";
import { useToast } from "./ui/Toast";
import { isContactPickerSupported, pickDeviceContacts } from "../lib/contactPicker";
import { ContactImport } from "./ui/icons";

interface ImportContactsModalProps {
  open: boolean;
  onClose: () => void;
  groups: Group[];
}

export function ImportContactsModal({ open, onClose, groups }: ImportContactsModalProps) {
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  function reset() {
    setFile(null);
    setParsed(null);
    setSelectedGroupIds([]);
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
      setParsed({ rows: [], headers: [], errors: [(err as Error).message] });
    }
  }

  async function handleDevicePick() {
    try {
      const rows = await pickDeviceContacts();
      if (rows.length === 0) return;
      setFile(new File([], "Phone contacts"));
      setParsed({ rows, headers: [], errors: [] });
    } catch (err) {
      show((err as Error).message, "danger");
    }
  }

  function toggleGroup(id: string) {
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  async function handleImport() {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    try {
      const result = await importContacts(parsed.rows, selectedGroupIds);
      show(
        `Imported ${result.created} contact${result.created === 1 ? "" : "s"}${
          result.skipped > 0 ? ` · ${result.skipped} skipped` : ""
        }`,
        "success",
      );
      handleClose();
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Contacts"
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
          Upload a CSV or Excel file with your contacts. Not sure of the format?
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
                  {parsed.rows.length === 1 ? "" : "s"} ready to import.
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

                {groups.length > 0 && (
                  <div>
                    <span className="block text-sm font-medium text-ink mb-1.5">
                      Add to group (optional)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {groups.map((g) => {
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
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
