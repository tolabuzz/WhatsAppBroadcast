import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, Users, Folder, MessageSquare, Send, LogOut } from "./ui/icons";
import { useAccount } from "../context/AccountContext";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/broadcasts", label: "Broadcasts", icon: Send, end: false },
  { to: "/contacts", label: "Contacts", icon: Users, end: false },
  { to: "/groups", label: "Groups", icon: Folder, end: false },
  { to: "/templates", label: "Templates", icon: MessageSquare, end: false },
];

export function Layout() {
  const { email, logout } = useAccount();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-full flex flex-col sm:flex-row">
      <aside className="hidden sm:flex sm:w-60 sm:flex-col sm:border-r sm:border-black/5 sm:bg-white sm:py-6 sm:px-4 sm:gap-1">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-brand-dark flex items-center justify-center text-white font-bold">
            B
          </div>
          <span className="font-semibold text-ink text-lg">Broadcast</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-brand-pale text-brand-dark" : "text-ink-muted hover:bg-black/5"
              }`
            }
          >
            <item.icon size={19} />
            {item.label}
          </NavLink>
        ))}

        <div className="mt-auto flex items-center gap-2 px-2 pt-4 border-t border-black/5">
          <span className="text-xs text-ink-muted truncate flex-1" title={email ?? ""}>
            {email}
          </span>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-black/5 text-ink-muted shrink-0"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-32 sm:pb-0">
          <Outlet />
        </main>

        <div className="sm:hidden fixed bottom-16 left-0 right-0 z-40 bg-surface-muted/95 backdrop-blur border-t border-black/5 px-4 py-1.5 flex items-center gap-2">
          <span className="text-[11px] text-ink-muted truncate flex-1">{email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-[11px] font-medium text-ink-muted px-2 py-1 rounded-lg hover:bg-black/5"
          >
            <LogOut size={13} />
            Log out
          </button>
        </div>

        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-black/5 safe-bottom">
          <div className="flex items-stretch">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
                    isActive ? "text-brand-dark" : "text-ink-muted"
                  }`
                }
              >
                <item.icon size={22} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
