import { Clock } from "lucide-react";
import { toast } from "sonner";
import { OsButton, PageHeader, PageLoading, SectionCard, StatCard } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatWhen } from "@/lib/format";

export default function StudioAttendance() {
  const { user } = useSession();
  const { data: rows, loading, reload: reloadRows } = useAsync(() => db.attendance.list(), []);
  const { data: staff, reload: reloadStaff } = useAsync(() => db.people.staff().catch(() => []), []);
  const names = Object.fromEntries((staff ?? []).map((item) => [item.id, item.name]));
  names[user?.id ?? ""] = user?.name ?? "You";
  const today = new Date().toISOString().slice(0, 10);
  const todayRows = (rows ?? []).filter((item) => item.at.slice(0, 10) === today);
  const lastMine = (rows ?? []).find((item) => item.userId === user?.id);

  if (loading && !rows) return <PageLoading />;

  async function punch(type: "in" | "out") {
    await db.attendance.clock(type);
    toast.success(type === "in" ? "Clocked in." : "Clocked out.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff attendance"
        subtitle="Floor and house clocks. Principle and manager see everyone."
        onRefresh={() => Promise.all([reloadRows(), reloadStaff()])}
        actions={
          <div className="flex gap-2">
            <OsButton variant="gold" onClick={() => punch("in")}>
              <Clock className="h-4 w-4" /> Clock in
            </OsButton>
            <OsButton variant="ghost" onClick={() => punch("out")}>
              Clock out
            </OsButton>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Punches today" value={String(todayRows.length)} />
        <StatCard label="Your last punch" value={lastMine ? lastMine.type : "—"} hint={lastMine ? formatWhen(lastMine.at) : "No punch yet"} />
        <StatCard label="On file" value={String(rows?.length ?? 0)} />
      </div>
      <SectionCard title="Log">
        <ul className="space-y-2">
          {(rows ?? []).map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
              <span className="text-ink">{names[item.userId] ?? item.userId}</span>
              <span className="capitalize">{item.type === "in" ? "In" : "Out"}</span>
              <span>{formatWhen(item.at)}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
