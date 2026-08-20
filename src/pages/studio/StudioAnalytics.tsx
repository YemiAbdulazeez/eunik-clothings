import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, SectionCard, StatCard } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";

type Tab = "sales" | "traffic";

export default function StudioAnalytics() {
  const { user } = useSession();
  const principal = user?.role === "super_admin";
  const [tab, setTab] = useState<Tab>("sales");
  const { data: overview } = useAsync(() => db.analytics.studioOverview(), []);
  const { data: series } = useAsync(() => db.analytics.salesSeries(), []);
  const { data: profit } = useAsync(() => db.analytics.profit(), []);
  const { data: traffic } = useAsync(
    () => (principal && tab === "traffic" ? db.analytics.traffic("30d") : Promise.resolve(null)),
    [principal, tab],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle={
          principal
            ? "Sales and profit for finance; site traffic for the house principal only."
            : "Collections are successful Paystack and verified transfers."
        }
        actions={
          principal ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("sales")}
                className={`os-pill ${tab === "sales" ? "bg-ink text-white" : "border border-line text-ink"}`}
              >
                Sales
              </button>
              <button
                type="button"
                onClick={() => setTab("traffic")}
                className={`os-pill ${tab === "traffic" ? "bg-ink text-white" : "border border-line text-ink"}`}
              >
                Traffic
              </button>
            </div>
          ) : null
        }
      />

      {tab === "sales" || !principal ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue" value={formatNaira(profit?.revenueKobo ?? overview?.revenueKobo ?? 0)} />
            <StatCard label="Est. COGS" value={formatNaira(profit?.cogsKobo ?? 0)} />
            <StatCard label="Profit" value={formatNaira(profit?.profitKobo ?? 0)} tone="gold" />
            <StatCard label="Margin" value={`${Math.round((profit?.margin ?? 0) * 100)}%`} />
          </div>
          <SectionCard title="Daily collections (₦)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series ?? []}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e4e4e4" />
                  <XAxis dataKey="day" stroke="#828282" fontSize={12} />
                  <YAxis stroke="#828282" fontSize={12} />
                  <Tooltip formatter={(value) => `₦${Number(value).toLocaleString("en-NG")}`} />
                  <Bar dataKey="naira" fill="#232323" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
          <SectionCard title="Profit by kind">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="py-3">Kind</th>
                    <th>Sales</th>
                    <th>COGS</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {(profit?.byKind ?? []).map((row) => (
                    <tr key={row.kind} className="border-b border-line/70">
                      <td className="py-3 capitalize text-ink">{row.kind.replaceAll("_", " ")}</td>
                      <td>{formatNaira(row.sales)}</td>
                      <td>{formatNaira(row.cogs)}</td>
                      <td>{formatNaira(row.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      ) : null}

      {tab === "traffic" && principal && traffic ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Views (30d)" value={String(traffic.summary.views)} />
            <StatCard label="Visitors" value={String(traffic.summary.visitors)} />
            <StatCard label="Sessions" value={String(traffic.summary.sessions)} />
            <StatCard label="Active now" value={String(traffic.summary.activeNow ?? 0)} tone="gold" />
          </div>
          <SectionCard title="Views over time">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={traffic.viewsSeries}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e4e4e4" />
                  <XAxis dataKey="day" stroke="#828282" fontSize={12} />
                  <YAxis stroke="#828282" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#eeb167" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Channels">
              <ul className="space-y-2 text-sm">
                {traffic.channels.map((row) => (
                  <li key={row.channel} className="flex justify-between rounded-xl border border-line px-3 py-2">
                    <span className="capitalize text-ink">{row.channel}</span>
                    <span>{row.views} views</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard title="Top pages">
              <ul className="space-y-2 text-sm">
                {traffic.topPages.map((row) => (
                  <li key={row.path} className="flex justify-between rounded-xl border border-line px-3 py-2">
                    <span className="text-ink">{row.path}</span>
                    <span>{row.views}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
          <SectionCard title="House funnel">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {traffic.funnels.map((row) => (
                <StatCard key={row.name} label={row.name} value={String(row.count)} />
              ))}
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
