import { Clock } from "lucide-react";
import { toast } from "sonner";
import { OsButton, PageError, PageHeader, PageLoading, SectionCard, StatCard } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import type { AttendanceEvent } from "@/db/types";
import { useAsync } from "@/hooks/useAsync";
import { formatWhen } from "@/lib/format";
import { getCurrentPosition, workSiteLabel } from "@/lib/geo";
import { useState } from "react";

type AttendanceList = AttendanceEvent[] & {
  myWorkSite?: string | null;
};

export default function StudioAttendance() {
  const { user } = useSession();
  const { data: rows, loading, error, reload: reloadRows } = useAsync(
    () => db.attendance.list() as Promise<AttendanceList>,
    [],
  );
  const { data: staff, reload: reloadStaff } = useAsync(() => db.people.staff().catch(() => []), []);
  const [busy, setBusy] = useState<"in" | "out" | null>(null);

  const names = Object.fromEntries((staff ?? []).map((item) => [item.id, item.name]));
  names[user?.id ?? ""] = user?.name ?? "You";
  const today = new Date().toISOString().slice(0, 10);
  const todayRows = (rows ?? []).filter((item) => String(item.at).slice(0, 10) === today);
  const lastMine = (rows ?? []).find((item) => item.userId === user?.id);
  const mySite = rows?.myWorkSite ?? user?.workSite ?? null;

  if (loading && !rows) return <PageLoading />;
  if (error && !rows) return <PageError message={error} onRetry={() => Promise.all([reloadRows(), reloadStaff()])} />;

  async function punch(type: "in" | "out") {
    if (busy) return;
    setBusy(type);
    try {
      const geo = await getCurrentPosition();
      await db.attendance.clock(type, geo);
      toast.success(type === "in" ? "Clocked in." : "Clocked out.");
      await reloadRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record punch.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff attendance"
        subtitle="Geotagged clock in / out at your assigned site (100m). Principal and manager see everyone."
        onRefresh={() => Promise.all([reloadRows(), reloadStaff()])}
        actions={
          <div className="flex gap-2">
            <OsButton variant="gold" loading={busy === "in"} onClick={() => void punch("in")}>
              <Clock className="h-4 w-4" /> Clock in
            </OsButton>
            <OsButton variant="ghost" loading={busy === "out"} onClick={() => void punch("out")}>
              Clock out
            </OsButton>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Punches today" value={String(todayRows.length)} />
        <StatCard
          label="Your last punch"
          value={lastMine ? lastMine.type : "—"}
          hint={lastMine ? formatWhen(lastMine.at) : "No punch yet"}
        />
        <StatCard label="Your site" value={workSiteLabel(mySite)} hint="Assigned at hire — GPS checked here" />
      </div>
      <SectionCard title="Log">
        <ul className="space-y-2">
          {(rows ?? []).map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-4 py-3 text-sm"
            >
              <span className="text-ink">{names[item.userId] ?? item.userName}</span>
              <span className="capitalize">{item.type === "in" ? "In" : "Out"}</span>
              <span className="text-muted">{workSiteLabel(item.workSite)}</span>
              <span>
                {item.distanceM != null ? `${Math.round(item.distanceM)}m` : "—"}
                {item.withinGeofence === false ? " · outside" : ""}
              </span>
              <span>{formatWhen(item.at)}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
