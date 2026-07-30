import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBroadcasts } from "../hooks/useData";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { ProgressBar } from "../components/ui/ProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { Plus, Send } from "../components/ui/icons";
import { broadcastStats } from "../db/broadcasts";
import type { BroadcastStatus } from "../types";

const FILTERS: { key: BroadcastStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

function statusTone(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "active") return "info" as const;
  if (status === "archived") return "neutral" as const;
  return "warning" as const;
}

export function Broadcasts() {
  const broadcasts = useBroadcasts();
  const [filter, setFilter] = useState<BroadcastStatus | "all">("all");

  const filtered = useMemo(() => {
    if (!broadcasts) return [];
    if (filter === "all") return broadcasts.filter((b) => b.status !== "archived");
    return broadcasts.filter((b) => b.status === filter);
  }, [broadcasts, filter]);

  return (
    <div>
      <PageHeader
        title="Broadcasts"
        actions={
          <Link to="/broadcasts/new">
            <Button size="sm" icon={<Plus size={15} />}>
              New
            </Button>
          </Link>
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === f.key
                  ? "bg-brand-dark text-white border-transparent"
                  : "text-ink-muted border-black/10 hover:bg-black/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Send size={26} />}
            title="No broadcasts here"
            description="Create a new broadcast to reach your community with personalized messages."
            action={
              <Link to="/broadcasts/new">
                <Button icon={<Plus size={15} />}>New Broadcast</Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((b) => {
              const stats = broadcastStats(b);
              return (
                <Link key={b.id} to={`/broadcasts/${b.id}`}>
                  <Card className="p-4 hover:border-brand-light/50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-ink text-sm truncate">{b.title}</h3>
                      <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                    </div>
                    <p className="text-xs text-ink-muted mb-2">
                      {stats.sent}/{stats.total} sent
                      {stats.skipped > 0 ? ` · ${stats.skipped} skipped` : ""} · {stats.percentComplete}% complete
                    </p>
                    <ProgressBar percent={stats.percentComplete} />
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
