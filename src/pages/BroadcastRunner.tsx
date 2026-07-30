import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBroadcast } from "../hooks/useData";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { ProgressBar } from "../components/ui/ProgressBar";
import { ArrowLeft, Send, Check, SkipForward, Phone } from "../components/ui/icons";
import { broadcastStats, markRecipientStatus } from "../db/broadcasts";
import { personalizeMessage } from "../lib/personalize";
import { openWhatsApp } from "../lib/whatsapp";
import { formatPhoneDisplay } from "../lib/phone";
import { useToast } from "../components/ui/Toast";

export function BroadcastRunner() {
  const { id } = useParams<{ id: string }>();
  const broadcast = useBroadcast(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const [opened, setOpened] = useState(false);
  const [lastActedIndex, setLastActedIndex] = useState<number | null>(null);

  const pendingIndex = useMemo(() => {
    if (!broadcast) return -1;
    return broadcast.recipients.findIndex((r) => r.status === "pending");
  }, [broadcast]);

  if (!broadcast) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-sm text-ink-muted">Loading...</p>
      </div>
    );
  }

  const stats = broadcastStats(broadcast);
  const current = pendingIndex >= 0 ? broadcast.recipients[pendingIndex] : undefined;
  const message = current ? personalizeMessage(broadcast.messageBody, current) : "";

  async function handleAction(status: "sent" | "skipped") {
    if (pendingIndex < 0) return;
    await markRecipientStatus(broadcast!.id, pendingIndex, status);
    setLastActedIndex(pendingIndex);
    setOpened(false);
  }

  async function handleUndo() {
    if (lastActedIndex === null) return;
    await markRecipientStatus(broadcast!.id, lastActedIndex, "pending");
    setLastActedIndex(null);
  }

  return (
    <div className="min-h-full flex flex-col bg-surface-muted">
      <header className="sticky top-0 z-10 bg-white border-b border-black/5 safe-top">
        <div className="flex items-center gap-2 px-4 py-3.5">
          <button
            onClick={() => navigate(`/broadcasts/${broadcast.id}`)}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-black/5 text-ink shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-ink truncate">{broadcast.title}</h1>
            <p className="text-xs text-ink-muted">
              {stats.sent + stats.skipped}/{stats.total} processed
            </p>
          </div>
          {lastActedIndex !== null && (
            <Button size="sm" variant="ghost" onClick={handleUndo}>
              Undo
            </Button>
          )}
        </div>
        <ProgressBar percent={stats.percentComplete} />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {!current ? (
          <div className="flex flex-col items-center text-center max-w-sm animate-pop-in">
            <div className="w-16 h-16 rounded-full bg-brand-pale text-brand-dark flex items-center justify-center mb-4">
              <Check size={30} />
            </div>
            <h2 className="text-xl font-bold text-ink mb-1.5">Broadcast complete</h2>
            <p className="text-sm text-ink-muted mb-6">
              {stats.sent} sent · {stats.skipped} skipped out of {stats.total} recipients.
            </p>
            <Link to={`/broadcasts/${broadcast.id}`}>
              <Button>View Summary</Button>
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center animate-pop-in" key={pendingIndex}>
            <Avatar name={`${current.firstName} ${current.lastName}`} size={64} />
            <h2 className="text-lg font-bold text-ink mt-3">
              {current.firstName} {current.lastName}
            </h2>
            <p className="text-sm text-ink-muted flex items-center gap-1.5 mb-5">
              <Phone size={13} />
              {formatPhoneDisplay(current.phone)}
            </p>

            <div className="w-full rounded-2xl bg-chat-bg p-4 mb-6">
              <div className="bg-brand-pale rounded-xl rounded-tl-sm px-3.5 py-2.5 shadow-sm">
                <p className="text-sm text-ink whitespace-pre-line">{message}</p>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              icon={<Send size={17} />}
              onClick={() => {
                openWhatsApp(current.phone, message);
                setOpened(true);
              }}
              className="mb-3"
            >
              Open WhatsApp
            </Button>

            {!opened && (
              <p className="text-xs text-ink-muted text-center mb-3">
                Tap Open WhatsApp, review the message, then send it manually.
              </p>
            )}

            <div className="flex gap-2 w-full">
              <Button
                fullWidth
                variant="outline"
                icon={<SkipForward size={16} />}
                onClick={() => handleAction("skipped")}
              >
                Skip
              </Button>
              <Button
                fullWidth
                variant={opened ? "primary" : "secondary"}
                icon={<Check size={16} />}
                onClick={() => {
                  handleAction("sent");
                  show(`Marked ${current.firstName} as sent`, "success");
                }}
              >
                Mark as Sent
              </Button>
            </div>
          </div>
        )}
      </div>

      {current && (
        <div className="px-4 pb-6 safe-bottom">
          <p className="text-center text-xs text-ink-muted">
            {stats.pending} recipient{stats.pending === 1 ? "" : "s"} remaining · You can pause anytime, progress is saved.
          </p>
        </div>
      )}
    </div>
  );
}
