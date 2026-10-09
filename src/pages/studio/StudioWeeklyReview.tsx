import { useState } from "react";
import { toast } from "sonner";
import { OsButton, PageHeader, PageLoading, SectionCard, StatCard, StatusBadge } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import type { WeeklyReviewRow } from "@/db/types";
import { useAsync } from "@/hooks/useAsync";
import { workSiteLabel } from "@/lib/geo";
import { roleLabel } from "@/lib/format";

function mondayOf(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function StudioWeeklyReview() {
  const { user } = useSession();
  const allowed = user?.role === "super_admin" || user?.role === "manager";
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date().toISOString().slice(0, 10)));
  const [busy, setBusy] = useState(false);
  const { data, loading, reload } = useAsync(
    () =>
      allowed
        ? (db.dailyReports.weekly(weekStart) as Promise<{
            weekStart: string;
            weekEndExclusive: string;
            status: string;
            rows: WeeklyReviewRow[];
          }>)
        : Promise.resolve(null),
    [allowed, weekStart],
  );

  if (!allowed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Weekly review" subtitle="Manager and principal only." />
        <SectionCard title="Restricted">Ask a manager or the principal for this worksheet.</SectionCard>
      </div>
    );
  }

  if (loading && !data) return <PageLoading />;
  const rows = data?.rows ?? [];
  const locked = data?.status === "locked";

  async function toggleLock() {
    setBusy(true);
    try {
      await db.dailyReports.lockWeek(weekStart, !locked);
      toast.success(locked ? "Week reopened." : "Week locked.");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update week.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly review"
        subtitle="Attendance hours + piece counts — evidence for payout (no auto rates)."
        onRefresh={() => reload()}
        actions={
          <OsButton variant={locked ? "ghost" : "gold"} loading={busy} onClick={() => void toggleLock()}>
            {locked ? "Unlock week" : "Lock week"}
          </OsButton>
        }
      />
      <SectionCard title="Week">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Week starting (Monday)
            <input
              type="date"
              className="mt-1 block rounded-xl border border-line bg-white px-3 py-2 text-sm"
              value={weekStart}
              onChange={(event) => setWeekStart(mondayOf(event.target.value))}
            />
          </label>
          <StatusBadge label={locked ? "Locked" : "Open"} tone={locked ? "warn" : "ok"} />
        </div>
      </SectionCard>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Staff" value={String(rows.length)} />
        <StatCard
          label="Total hours"
          value={String(Math.round(rows.reduce((n, r) => n + r.hours, 0) * 100) / 100)}
        />
        <StatCard label="Total pieces" value={String(rows.reduce((n, r) => n + r.totalPieces, 0))} tone="gold" />
      </div>
      <SectionCard title="Worksheet">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2">Name</th>
                <th>Role</th>
                <th>Site</th>
                <th>Hours</th>
                <th>Reports</th>
                <th>Pieces</th>
                <th>Flag</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className="border-b border-line/70 align-top">
                  <td className="py-2 text-ink">{row.name}</td>
                  <td>{roleLabel(row.role)}</td>
                  <td>{workSiteLabel(row.workSite)}</td>
                  <td>{row.hours}</td>
                  <td>
                    {row.daysReported}/{row.clockedDays} days
                  </td>
                  <td>
                    <p className="font-medium">{row.totalPieces}</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-muted">
                      {row.pieces
                        .filter((p) => p.qty > 0)
                        .map((p) => (
                          <li key={p.slug}>
                            {p.label}: {p.qty}
                          </li>
                        ))}
                    </ul>
                  </td>
                  <td>
                    {row.missingReportWarning ? (
                      <StatusBadge label="Missing report" tone="warn" />
                    ) : (
                      <StatusBadge label="OK" tone="ok" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
