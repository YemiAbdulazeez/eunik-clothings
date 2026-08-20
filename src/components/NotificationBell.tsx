import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";

export default function NotificationBell() {
  const { data: notes, reload } = useAsync(() => db.notifications.listMine(), []);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = (notes ?? []).filter((item) => !item.read).length;

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function openTray() {
    setOpen((value) => !value);
    if (!open) await db.notifications.markAllRead();
    reload();
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-label="Notifications" className="relative" onClick={() => void openTray()}>
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-8 z-30 w-72 rounded-2xl border border-line bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">House notes</p>
          {(notes ?? []).length === 0 ? (
            <p className="text-sm text-muted">Nothing new.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {(notes ?? []).slice(0, 12).map((item) => (
                <li key={item.id} className="rounded-xl border border-line px-3 py-2">
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/account" className="mt-2 block text-xs underline" onClick={() => setOpen(false)}>
            Open account
          </Link>
        </div>
      ) : null}
    </div>
  );
}
