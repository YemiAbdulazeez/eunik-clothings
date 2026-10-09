import { useState } from "react";
import { OsButton, PageHeader, PageLoading, SectionCard, StatCard, StatusBadge } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import type { AttendanceRankingRow } from "@/db/types";
import { useAsync } from "@/hooks/useAsync";
import { workSiteLabel } from "@/lib/geo";
import { roleLabel } from "@/lib/format";

const RANGES = [
  { id: "7d", label: "7 days" },
  { id: "14d", label: "14 days" },
  { id: "30d", label: "30 days" },
] as const;

const SITES = [
  { id: "all", label: "All sites" },
  { id: "workstation", label: "Workstation" },
  { id: "studio", label: "Studio" },
] as const;

export default function StudioAttendanceAnalytics() {
  const { user } = useSession();
  const allowed = user?.role === "super_admin" || user?.role === "manager";
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("7d");
  const [site, setSite] = useState<(typeof SITES)[number]["id"]>("all");
  const { data, loading, reload } = useAsync(
    () => (allowed ? db.attendance.analytics(range, site) : Promise.resolve(null)),
    [allowed, range, site],
  );

  if (!allowed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Attendance analytics" subtitle="Manager and principal only." />
        <SectionCard title="Restricted">Ask a manager or the principal for this view.</SectionCard>
      </div>
    );
  }

  if (loading && !data) return <PageLoading />;
  const report = (data as { report?: { summary: Record<string, number>; ranking: AttendanceRankingRow[] } } | null)
    ?.report;
  const summary = report?.summary;
  const ranking = report?.ranking ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance analytics"
        subtitle="Hours, presence, geofence compliance, and ranking."
        onRefresh={() => reload()}
      />
      <div className="flex flex-wrap gap-2">
        {RANGES.map((item) => (
          <OsButton
            key={item.id}
            variant={range === item.id ? "gold" : "ghost"}
            onClick={() => setRange(item.id)}
          >
            {item.label}
          </OsButton>
        ))}
        {SITES.map((item) => (
          <OsButton
            key={item.id}
            variant={site === item.id ? "gold" : "ghost"}
            onClick={() => setSite(item.id)}
          >
            {item.label}
          </OsButton>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Staff in range" value={String(summary?.staffCounted ?? 0)} />
        <StatCard label="Present today" value={String(summary?.presentToday ?? 0)} tone="gold" />
        <StatCard label="Total hours" value={String(summary?.totalHours ?? 0)} />
        <StatCard label="Punches" value={String(summary?.punches ?? 0)} />
      </div>
      <SectionCard title="Ranking">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2">#</th>
                <th>Name</th>
                <th>Role</th>
                <th>Site</th>
                <th>Hours</th>
                <th>Days</th>
                <th>Geofence</th>
                <th>Now</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row, index) => (
                <tr key={row.userId} className="border-b border-line/70">
                  <td className="py-2">{index + 1}</td>
                  <td className="text-ink">{row.name}</td>
                  <td>{roleLabel(row.role)}</td>
                  <td>{workSiteLabel(row.workSite)}</td>
                  <td>{row.hours}</td>
                  <td>{row.daysPresent}</td>
                  <td>{row.geofencePct == null ? "—" : `${row.geofencePct}%`}</td>
                  <td>
                    {row.clockedInNow ? <StatusBadge label="In" tone="ok" /> : <StatusBadge label="—" tone="muted" />}
                  </td>
                </tr>
              ))}
              {!ranking.length ? (
                <tr>
                  <td colSpan={8} className="py-6 text-muted">
                    No punches in this range yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
