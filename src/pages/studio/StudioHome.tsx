import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Factory,
  Headphones,
  Layers,
  Shirt,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashNavGrid, NeedAttention, PageHeader, ProgressBar, SectionCard, StatCard, StatusBadge } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { canSeeSection } from "@/lib/rbac";
import { statusTone } from "@/lib/format";

const COLORS = ["#232323", "#eeb167", "#828282"];

export default function StudioHome() {
  const { user } = useSession();
  const { data: overview } = useAsync(() => db.analytics.studioOverview(), []);
  const { data: series } = useAsync(() => db.analytics.salesSeries(), []);
  const { data: orders } = useAsync(() => db.orders.listAll().catch(() => []), []);
  const { data: leads } = useAsync(() => db.leads.list().catch(() => []), []);
  const { data: fabrics } = useAsync(() => db.products.fabrics(), []);
  const { data: appointments } = useAsync(() => db.appointments.listAll().catch(() => []), []);
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const { data: requests } = useAsync(() => db.customDesigns.listAll().catch(() => []), []);
  const { data: board } = useAsync(() => db.production.listBoard().catch(() => []), []);
  const role = user?.role;
  const canAnalytics = user ? canSeeSection(user, "analytics") : false;
  const canPayments = user ? canSeeSection(user, "payments") : false;
  const canCustom = user ? canSeeSection(user, "custom") : false;
  const canProduction = user ? canSeeSection(user, "production") : false;
  const newRequests = (requests ?? []).filter((item) => item.status === "new");
  const mix = [
    { name: "RTW", value: overview?.mix.rtw ?? 0 },
    { name: "MTM", value: overview?.mix.mtm ?? 0 },
    { name: "Bespoke", value: overview?.mix.bespoke ?? 0 },
  ];
  const pipeline = Object.entries(overview?.pipeline ?? {}).map(([stage, count]) => ({
    stage: stage.replaceAll("_", " "),
    count,
  }));
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const unclaimed = (leads ?? []).filter((item) => item.status === "unclaimed");
  const today = settings?.demoToday ?? new Date().toISOString().slice(0, 10);

  const attention = [
    ...(role === "desk" || role === "super_admin" || role === "manager"
      ? newRequests.map((item) => ({
          id: item.id,
          title: `New bespoke request · ${item.outfitType}`,
          detail: `${item.colour} · ${item.occasion}`,
          href: "/studio/custom",
        }))
      : []),
    ...(canPayments && (overview?.awaitingReceipts ?? 0) > 0
      ? [
          {
            id: "receipts",
            title: `${overview?.awaitingReceipts} bank receipts waiting`,
            detail: "Finance must approve before the ticket is confirmed.",
            href: "/studio/payments",
          },
        ]
      : []),
    ...unclaimed.map((lead) => ({
      id: lead.id,
      title: `WhatsApp lead ${lead.sku}`,
      detail: "Unclaimed — desk should own this click.",
      actionLabel: "Claim",
      onAction: () =>
        void db.leads.claim(lead.id, { openTicket: true }).then(({ orderNumber }) =>
          toast.success(orderNumber ? `Claimed — ticket #${orderNumber} opened.` : "Lead claimed."),
        ),
    })),
    ...((fabrics ?? []).filter((item) => item.status === "low").map((item) => ({
      id: item.id,
      title: `Low fabric · ${item.name}`,
      detail: `${item.yards} yards remaining on the floor.`,
      href: "/studio/products",
    }))),
    ...((appointments ?? [])
      .filter((item) => item.date === today)
      .map((item) => ({
        id: item.id,
        title: `${item.service} today`,
        detail: `${item.time} · ${item.customerName} · ${item.location}`,
        href: "/studio/orders",
      }))),
  ];

  const tiles = [
    { to: "/studio/orders", label: "Order monitoring", hint: "Status updates", icon: ClipboardList, section: "orders" as const },
    { to: "/studio/products", label: "Products", hint: "Add, edit, uploads", icon: Shirt, section: "products" as const },
    { to: "/studio/collections", label: "Collections", hint: "Standalone rail", icon: Layers, section: "collections" as const },
    { to: "/studio/customers", label: "Clients", hint: "CRM follow-up", icon: Users, section: "customers" as const },
    { to: "/studio/payments", label: "Collections", hint: "Paystack & bank", icon: Wallet, section: "payments" as const },
    { to: "/studio/analytics", label: "Sales & profit", hint: "Naira board", icon: BarChart3, section: "analytics" as const },
    { to: "/studio/support", label: "Customer support", hint: "Desk inbox", icon: Headphones, section: "support" as const },
    { to: "/studio/people", label: "Staff & access", hint: "Roles", icon: UserCog, section: "people" as const },
    { to: "/studio/events", label: "Event editor", hint: "Trunk shows", icon: Calendar, section: "events" as const },
    { to: "/studio/production", label: "Floor tickets", hint: "Kanban", icon: Factory, section: "production" as const },
  ].filter((tile) => (user ? canSeeSection(user, tile.section) : true));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Fashion House OS · ${user?.role.replaceAll("_", " ")}`}
        title={`${greet}, ${user?.firstName}.`}
        subtitle={
          role === "desk"
            ? "Leads, bookings, and bespoke requests — exceptions first."
            : role === "finance"
              ? "Receipts and outstanding balances."
              : role === "designer"
                ? "Custom inbox and quotes."
                : role === "content"
                  ? "Magazine, events, and the rail."
                  : "Exceptions first, then the naira, then the floor."
        }
        actions={
          canCustom ? (
            <Link to="/studio/custom" className="os-pill bg-gold text-ink">
              Review custom requests
            </Link>
          ) : role === "super_admin" ? (
            <Link to="/studio/analytics" className="os-pill bg-gold text-ink">
              Open analytics & traffic
            </Link>
          ) : null
        }
      />

      <NeedAttention items={attention} />

      {canAnalytics || canPayments ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {canAnalytics ? (
            <>
              <StatCard label="Collected" value={formatNaira(overview?.revenueKobo ?? 0)} hint="Successful Paystack + transfers" />
              <StatCard label="Outstanding" value={formatNaira(overview?.outstandingKobo ?? 0)} tone="gold" hint="Balances still on the book" />
            </>
          ) : null}
          {canPayments ? (
            <StatCard label="Receipts waiting" value={String(overview?.awaitingReceipts ?? 0)} tone="gold" />
          ) : null}
          <StatCard label="Open tickets" value={String(overview?.openOrders ?? 0)} />
          {canCustom ? <StatCard label="Active bespoke" value={String(overview?.activeBespoke ?? 0)} /> : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Unclaimed leads" value={String(unclaimed.length)} />
          <StatCard label="New requests" value={String(newRequests.length)} />
          <StatCard label="Appointments today" value={String((appointments ?? []).filter((item) => item.date === today).length)} />
        </div>
      )}

      <DashNavGrid tiles={tiles} />

      {canAnalytics ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Daily collections (₦)">
            <div className="h-64">
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
          <SectionCard title="Revenue mix">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mix} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                    {mix.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNaira(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-4 text-sm">
              {mix.map((item, index) => (
                <span key={item.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[index] }} />
                  {item.name}
                </span>
              ))}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {canProduction ? (
        <SectionCard title="Production pipeline">
          <div className="space-y-3">
            {(pipeline.length ? pipeline : [{ stage: "sewing", count: 1 }]).map((row) => (
              <div key={row.stage}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize text-ink">{row.stage}</span>
                  <span>{row.count}</span>
                </div>
                <ProgressBar value={Math.min(100, row.count * 28)} gold={row.stage.includes("sew")} />
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Recent orders"
        action={
          <Link to="/studio/orders" className="text-sm underline">
            All
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-3">#</th>
                <th>Client</th>
                <th>Look</th>
                <th>Kind</th>
                <th>Status</th>
                <th>₦</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).slice(0, 8).map((order) => (
                <tr key={order.id} className="border-b border-line/70">
                  <td className="py-3 font-medium text-ink">
                    <Link to={`/studio/orders/${order.id}`} className="underline">
                      {order.number}
                    </Link>
                  </td>
                  <td>{order.customerName}</td>
                  <td>{order.name}</td>
                  <td className="capitalize">{order.kind.replaceAll("_", " ")}</td>
                  <td>
                    <StatusBadge label={order.status.replaceAll("_", " ")} tone={statusTone(order.status)} />
                  </td>
                  <td className="text-ink">{formatNaira(order.totalKobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Floor tickets">
          <ul className="space-y-2">
            {(board ?? []).slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
                <span className="text-ink">
                  #{item.orderId.replace("order_", "")} {item.garment}
                </span>
                <StatusBadge label={item.stage.replaceAll("_", " ")} tone="gold" />
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard
          title="QC / Fits"
          action={
            <Link to="/studio/production" className="text-sm underline">
              Kanban
            </Link>
          }
        >
          <p className="text-sm">Advance a stage from Production. Gold is only a seal — the ink rail owns the floor.</p>
          <Link to="/studio/production" className="os-pill mt-4 inline-flex bg-ink text-white">
            Open production
          </Link>
        </SectionCard>
      </div>
    </div>
  );
}
