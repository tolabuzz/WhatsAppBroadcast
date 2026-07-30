import { Link } from "react-router-dom";
import { useContacts, useGroups, useBroadcasts } from "../hooks/useData";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { ProgressBar } from "../components/ui/ProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { broadcastStats } from "../db/broadcasts";
import { Plus, Users, Send, MessageSquare, UserPlus } from "../components/ui/icons";

function statusTone(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "active") return "info" as const;
  if (status === "archived") return "neutral" as const;
  return "warning" as const;
}

export function Dashboard() {
  const contacts = useContacts();
  const groups = useGroups();
  const broadcasts = useBroadcasts();

  const activeBroadcasts = (broadcasts ?? []).filter((b) => b.status !== "archived");
  const recent = activeBroadcasts.slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <p className="text-sm text-ink-muted">Welcome back</p>
        <h1 className="text-2xl font-bold text-ink">Let's stay connected</h1>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-2xl font-bold text-brand-dark">{contacts?.length ?? 0}</p>
          <p className="text-xs text-ink-muted mt-0.5">Contacts</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-brand-dark">{groups?.length ?? 0}</p>
          <p className="text-xs text-ink-muted mt-0.5">Groups</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-brand-dark">{activeBroadcasts.length}</p>
          <p className="text-xs text-ink-muted mt-0.5">Broadcasts</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link to="/broadcasts/new">
          <Button fullWidth size="lg" icon={<Plus size={18} />}>
            New Broadcast
          </Button>
        </Link>
        <Link to="/contacts">
          <Button fullWidth size="lg" variant="secondary" icon={<UserPlus size={18} />}>
            Add Contacts
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-ink">Recent broadcasts</h2>
        <Link to="/broadcasts" className="text-sm font-medium text-brand-dark">
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Send size={26} />}
            title="No broadcasts yet"
            description="Create your first personalized broadcast to reach your community."
            action={
              <Link to="/broadcasts/new">
                <Button icon={<Plus size={16} />}>Create Broadcast</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {recent.map((b) => {
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
                    {stats.skipped > 0 ? ` · ${stats.skipped} skipped` : ""}
                  </p>
                  <ProgressBar percent={stats.percentComplete} />
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-8">
        <Link to="/templates">
          <Card className="p-4 flex items-center gap-3 hover:border-brand-light/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-pale text-brand-dark flex items-center justify-center shrink-0">
              <MessageSquare size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Templates</p>
              <p className="text-xs text-ink-muted">Reusable messages</p>
            </div>
          </Card>
        </Link>
        <Link to="/groups">
          <Card className="p-4 flex items-center gap-3 hover:border-brand-light/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-pale text-brand-dark flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Groups</p>
              <p className="text-xs text-ink-muted">Organize contacts</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
