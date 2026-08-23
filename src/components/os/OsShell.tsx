import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, Search, X, type LucideIcon } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useSession } from "@/context/SessionProvider";
import InstallPrompt from "@/components/InstallPrompt";
import NotificationBell from "@/components/NotificationBell";

export type OsItem = { to: string; label: string; icon: LucideIcon };

export default function OsShell({
  brand,
  mark,
  items,
  searchPlaceholder,
  profileTo,
  children,
}: {
  brand: string;
  mark: ReactNode;
  items: OsItem[];
  searchPlaceholder: string;
  profileTo: string;
  children?: ReactNode;
}) {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("eunik_sidebar_state") === "collapsed");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const initials = useMemo(
    () =>
      (user?.name ?? "E")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user],
  );

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("eunik_sidebar_state", next ? "collapsed" : "open");
  }

  function signOut() {
    const login = location.pathname.startsWith("/account") ? "/account/login" : "/studio/login";
    setSigningOut(true);
    void logout()
      .then(() => navigate(login))
      .finally(() => setSigningOut(false));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = searchQ.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-[var(--sidebar-accent)] text-gold" : "text-white/80 hover:bg-white/5"}`;

  return (
    <div className="eunik-os flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside
        className={`hidden flex-col bg-[var(--sidebar)] text-white lg:flex ${collapsed ? "w-16" : "w-64"} transition-[width]`}
      >
        <div className="flex items-center gap-3 px-3 py-4">
          {mark}
          {!collapsed ? (
            <div>
              <p className="font-alt text-lg">EUNIK</p>
              <p className="text-[10px] uppercase tracking-widest text-white/60">{brand}</p>
            </div>
          ) : null}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to.split("/").length <= 2} className={navLinkClass}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? item.label : null}
              </NavLink>
            );
          })}
        </nav>
        <div className="space-y-2 p-3">
          <NavLink
            to={profileTo}
            className="flex items-center gap-2 rounded-lg bg-[var(--sidebar-accent)] px-3 py-2 text-sm text-white/90"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-semibold text-ink">
              {initials}
            </span>
            {!collapsed ? <span>Profile</span> : null}
          </NavLink>
          <button
            type="button"
            aria-label="Sign out"
            disabled={signingOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed ? (signingOut ? "Signing out…" : "Sign out") : null}
          </button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[var(--sidebar)] text-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                {mark}
                <div>
                  <p className="font-alt text-lg">EUNIK</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/60">{brand}</p>
                </div>
              </div>
              <button type="button" aria-label="Close" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-2">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to.split("/").length <= 2}
                    className={navLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <div className="space-y-2 border-t border-white/10 p-3">
              <NavLink to={profileTo} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" onClick={() => setMobileOpen(false)}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-semibold text-ink">
                  {initials}
                </span>
                Profile
              </NavLink>
              <button
                type="button"
                aria-label="Sign out"
                disabled={signingOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur">
          <button type="button" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <button type="button" className="hidden lg:inline" onClick={toggle} aria-label="Collapse">
            <Menu className="h-5 w-5" />
          </button>
          <form onSubmit={submitSearch} className="mx-auto flex max-w-md flex-1 items-center rounded-full border border-line bg-paper px-4 py-1.5">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={searchQ}
              onChange={(event) => setSearchQ(event.target.value)}
              placeholder={searchPlaceholder}
              className="ml-2 flex-1 bg-transparent text-sm outline-none"
            />
          </form>
          <span className="hidden rounded-full bg-ink/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink sm:inline">
            {user?.role.replace("_", " ")}
          </span>
          <NotificationBell />
          <button
            type="button"
            aria-label="Sign out"
            disabled={signingOut}
            title="Sign out"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-paper disabled:opacity-60"
            onClick={signOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 pb-28 lg:px-8">
          {children ?? <Outlet />}
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-line bg-white px-1 py-2 text-[11px] lg:hidden">
          {items.slice(0, 6).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 px-1 text-ink">
                <Icon className="h-4 w-4" />
                {item.label.split(" ")[0]}
              </NavLink>
            );
          })}
          <button type="button" className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 px-1 text-ink" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
            More
          </button>
        </nav>
      </div>
      <InstallPrompt />
    </div>
  );
}

export function HouseMark() {
  return <img src="/images/eunik.png" alt="EUNIK" className="h-8 w-auto brightness-0 invert" />;
}

export function GoldMark() {
  return <HouseMark />;
}

export function ClientMark() {
  return <HouseMark />;
}
