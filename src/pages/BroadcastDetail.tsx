import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBroadcast } from "../hooks/useData";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Avatar } from "../components/ui/Avatar";
import { Modal } from "../components/ui/Modal";
import { Input, TextArea } from "../components/ui/Input";
import { Play, Edit, Copy, Archive, Trash, Check, X as XIcon, Send } from "../components/ui/icons";
import { broadcastStats, updateBroadcast, deleteBroadcast, duplicateBroadcast } from "../db/broadcasts";
import { personalizeMessage } from "../lib/personalize";
import { formatPhoneDisplay } from "../lib/phone";
import { useToast } from "../components/ui/Toast";

function statusTone(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "active") return "info" as const;
  if (status === "archived") return "neutral" as const;
  return "warning" as const;
}

export function BroadcastDetail() {
  const { id } = useParams<{ id: string }>();
  const broadcast = useBroadcast(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [title, setTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");

  if (!broadcast) {
    return (
      <div>
        <PageHeader title="Broadcast" back />
      </div>
    );
  }

  const stats = broadcastStats(broadcast);
  const isResumable = broadcast.status === "draft" || broadcast.status === "active";

  function openEdit() {
    setTitle(broadcast!.title);
    setMessageBody(broadcast!.messageBody);
    setShowEdit(true);
  }

  async function handleSaveEdit() {
    await updateBroadcast(broadcast!.id, { title, messageBody });
    show("Broadcast updated", "success");
    setShowEdit(false);
  }

  async function handleDuplicate() {
    const copy = await duplicateBroadcast(broadcast!.id);
    show("Broadcast duplicated", "success");
    if (copy) navigate(`/broadcasts/${copy.id}`);
  }

  async function handleArchiveToggle() {
    await updateBroadcast(broadcast!.id, { status: broadcast!.status === "archived" ? "completed" : "archived" });
    show(broadcast!.status === "archived" ? "Broadcast restored" : "Broadcast archived", "success");
  }

  async function handleDelete() {
    if (!confirm(`Delete broadcast "${broadcast!.title}"? This cannot be undone.`)) return;
    await deleteBroadcast(broadcast!.id);
    show("Broadcast deleted");
    navigate("/broadcasts");
  }

  return (
    <div>
      <PageHeader title={broadcast.title} back />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 pb-10">
        <div className="flex items-center gap-2 mb-4">
          <Badge tone={statusTone(broadcast.status)}>{broadcast.status}</Badge>
          <span className="text-xs text-ink-muted">
            {stats.total} recipients · {stats.percentComplete}% complete
          </span>
        </div>

        <ProgressBar percent={stats.percentComplete} className="mb-4" />

        <div className="grid grid-cols-3 gap-2 mb-5">
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-brand-dark">{stats.sent}</p>
            <p className="text-[11px] text-ink-muted">Sent</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-ink">{stats.pending}</p>
            <p className="text-[11px] text-ink-muted">Pending</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-warning">{stats.skipped}</p>
            <p className="text-[11px] text-ink-muted">Skipped</p>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {isResumable && (
            <Link to={`/broadcasts/${broadcast.id}/run`}>
              <Button icon={<Play size={15} />}>{broadcast.status === "draft" ? "Start Broadcast" : "Resume"}</Button>
            </Link>
          )}
          <Button variant="outline" icon={<Edit size={15} />} onClick={openEdit}>
            Edit
          </Button>
          <Button variant="outline" icon={<Copy size={15} />} onClick={handleDuplicate}>
            Duplicate
          </Button>
          <Button variant="outline" icon={<Archive size={15} />} onClick={handleArchiveToggle}>
            {broadcast.status === "archived" ? "Unarchive" : "Archive"}
          </Button>
          <Button variant="ghost" icon={<Trash size={15} />} onClick={handleDelete} className="text-danger">
            Delete
          </Button>
        </div>

        <div className="mb-2">
          <span className="text-sm font-medium text-ink">Message template</span>
          <Card className="p-3.5 mt-1.5">
            <p className="text-sm text-ink whitespace-pre-line">{broadcast.messageBody}</p>
          </Card>
        </div>

        <div className="mt-5">
          <span className="text-sm font-medium text-ink">Recipients ({broadcast.recipients.length})</span>
          <div className="flex flex-col gap-0.5 mt-1.5 rounded-xl border border-black/5 overflow-hidden">
            {broadcast.recipients.map((r, i) => (
              <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 border-b border-black/5 last:border-0">
                <Avatar name={`${r.firstName} ${r.lastName}`} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink truncate">
                    {r.firstName} {r.lastName}
                  </p>
                  <p className="text-xs text-ink-muted truncate">{formatPhoneDisplay(r.phone)}</p>
                </div>
                {r.status === "sent" && (
                  <span className="flex items-center gap-1 text-xs text-brand-dark shrink-0">
                    <Check size={13} /> Sent
                  </span>
                )}
                {r.status === "skipped" && (
                  <span className="flex items-center gap-1 text-xs text-warning shrink-0">
                    <XIcon size={13} /> Skipped
                  </span>
                )}
                {r.status === "pending" && <span className="text-xs text-ink-muted shrink-0">Pending</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Broadcast"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextArea label="Message" rows={6} value={messageBody} onChange={(e) => setMessageBody(e.target.value)} />
          {broadcast.recipients[0] && (
            <div className="rounded-xl bg-chat-bg px-3.5 py-2.5">
              <p className="text-[11px] font-medium text-ink-muted mb-1 flex items-center gap-1">
                <Send size={11} /> Preview for {broadcast.recipients[0].firstName}
              </p>
              <p className="text-sm text-ink whitespace-pre-line">
                {personalizeMessage(messageBody, broadcast.recipients[0])}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
