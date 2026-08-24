import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, SectionCard, StatCard } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import type { TrafficSnapshot } from "@/db/types";

type Tab = "sales" | "traffic";
type Range = "today" | "7d" | "30d" | "all";

const RANGES: { id: Range; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All" },
];

export default function StudioAnalytics() {
  const { user } = useSession();
  const principal = user?.role === "super_admin";
  const [tab, setTab] = useState<Tab>("sales");
  const [range, setRange] = useState<Range>("30d");
  const overviewQ = useAsync(() => db.analytics.studioOverview(), []);
  const seriesQ = useAsync(() => db.analytics.salesSeries(), []);
  const profitQ = useAsync(() => db.analytics.profit(), []);
  const trafficQ = useAsync(
    () => (principal && tab === "traffic" ? db.analytics.traffic(range) : Promise.resolve(null)),
    [principal, tab, range],
  );
  const overview = overviewQ.data;
  const series = seriesQ.data;
  const profit = profitQ.data;
  const traffic = trafficQ.data as TrafficSnapshot | null;
  const trafficLoading = trafficQ.loading;
  const trafficError = trafficQ.error;

  async function refresh() {
    await Promise.all([overviewQ.reload(), seriesQ.reload(), profitQ.reload(), trafficQ.reload()]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle={
          principal
            ? "Sales and profit for finance; site traffic for the house principal only."
            : "Collections are successful Paystack and verified transfers."
        }
        onRefresh={() => refresh()}
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

      {tab === "traffic" && principal ? (
        <>
          <div className="flex flex-wrap gap-2">
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id)}
                className={`os-pill ${range === item.id ? "bg-ink text-white" : "border border-line text-ink"}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {trafficLoading && !traffic ? (
            <p className="text-sm text-muted">Loading traffic…</p>
          ) : null}
          {trafficError ? (
            <SectionCard title="Traffic">
              <p className="text-sm text-muted">{trafficError}</p>
            </SectionCard>
          ) : null}

          {traffic ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label={`Views (${range})`} value={String(traffic.summary.views)} />
                <StatCard label="Visitors" value={String(traffic.summary.visitors)} />
                <StatCard label="Sessions" value={String(traffic.summary.sessions)} />
                <StatCard label="Active now" value={String(traffic.summary.activeNow ?? 0)} tone="gold" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Bounce rate"
                  value={`${Math.round((traffic.summary.bounceRate ?? 0) * 100)}%`}
                />
                <StatCard
                  label="Pages / session"
                  value={(traffic.summary.pagesPerSession ?? 0).toFixed(1)}
                />
                <StatCard
                  label="View → bag"
                  value={`${Math.round((traffic.conversion?.viewItemToBag ?? 0) * 100)}%`}
                />
              </div>

              {!traffic.summary.views ? (
                <SectionCard title="No traffic yet">
                  <p className="text-sm text-muted">
                    Public pages send events after cookie consent. Open the shop in another tab, accept cookies,
                    browse a few looks, then refresh here.
                  </p>
                </SectionCard>
              ) : (
                <>
                  <SectionCard title="Views over time">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={traffic.viewsSeries}>
                          <CartesianGrid strokeDasharray="4 4" stroke="#e4e4e4" />
                          <XAxis dataKey="day" stroke="#828282" fontSize={12} />
                          <YAxis stroke="#828282" fontSize={12} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="views" fill="#eeb167" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </SectionCard>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <SectionCard title="Channels">
                      <ul className="space-y-2 text-sm">
                        {(traffic.channels.length ? traffic.channels : [{ channel: "—", views: 0 }]).map((row) => (
                          <li key={row.channel} className="flex justify-between rounded-xl border border-line px-3 py-2">
                            <span className="capitalize text-ink">{row.channel}</span>
                            <span>{row.views} views</span>
                          </li>
                        ))}
                      </ul>
                    </SectionCard>
                    <SectionCard title="Devices">
                      <ul className="space-y-2 text-sm">
                        {(traffic.devices?.length ? traffic.devices : [{ device: "—", views: 0 }]).map((row) => (
                          <li key={row.device} className="flex justify-between rounded-xl border border-line px-3 py-2">
                            <span className="capitalize text-ink">{row.device}</span>
                            <span>{row.views}</span>
                          </li>
                        ))}
                      </ul>
                    </SectionCard>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <SectionCard title="Top pages">
                      <ul className="space-y-2 text-sm">
                        {(traffic.topPages.length ? traffic.topPages : [{ path: "—", views: 0 }]).map((row) => (
                          <li key={row.path} className="flex justify-between gap-3 rounded-xl border border-line px-3 py-2">
                            <span className="truncate text-ink">{row.path}</span>
                            <span>{row.views}</span>
                          </li>
                        ))}
                      </ul>
                    </SectionCard>
                    <SectionCard title="Top looks viewed">
                      <ul className="space-y-2 text-sm">
                        {(traffic.topSkus?.length ? traffic.topSkus : [{ sku: "—", name: "—", views: 0 }]).map((row) => (
                          <li key={row.sku} className="flex justify-between gap-3 rounded-xl border border-line px-3 py-2">
                            <span className="truncate text-ink">{row.name || row.sku}</span>
                            <span>{row.views}</span>
                          </li>
                        ))}
                      </ul>
                    </SectionCard>
                  </div>
                  <SectionCard title="House funnel">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {traffic.funnels.map((row) => (
                        <StatCard key={row.name} label={row.name} value={String(row.count)} />
                      ))}
                    </div>
                  </SectionCard>
                </>
              )}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
