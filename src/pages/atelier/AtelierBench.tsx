import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Calendar, ClipboardList, Clock, Ruler, Shirt, User } from "lucide-react";
import { DashNavGrid, NeedAttention, OsButton, PageHeader, SectionCard, StatCard, StatusBadge } from "@/components/os/ui";
import { db, type ProductionStage } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/context/SessionProvider";
import { canSeeSection } from "@/lib/rbac";
import { nextLegalStage } from "@/lib/productionStages";
import { statusLabel, statusTone } from "@/lib/format";

export default function AtelierBench() {
  const { user } = useSession();
  const { data: board, reload } = useAsync(() => db.production.listBoard(), []);
  const { data: fittings } = useAsync(() => db.fittings.list(), []);
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const [clocked, setClocked] = useState(() => localStorage.getItem("eunik-clock") === "in");
  const assigned = board ?? [];
  const today = settings?.demoToday ?? new Date().toISOString().slice(0, 10);
  const overdue = assigned.filter((item) => item.dueDate < today);

  const tiles = [
    { to: "/atelier/queue", label: "Queue", hint: "Orders on the floor", icon: ClipboardList, section: "queue" as const },
    { to: "/atelier/fittings", label: "Fittings", hint: "On the book", icon: Ruler, section: "fittings" as const },
    { to: "/atelier/appointments", label: "Appointments", hint: "Walk-ins", icon: Calendar, section: "appointments" as const },
    { to: "/atelier/attendance", label: "Attendance", hint: "Clock in / out", icon: Clock, section: "attendance" as const },
    { to: "/atelier/profile", label: "My profile", hint: "Staff file", icon: User, section: "profile" as const },
    { to: "/atelier", label: "My bench", hint: "Assigned looks", icon: Shirt, section: "bench" as const },
  ].filter((tile) => (user ? canSeeSection(user, tile.section) : true));

  function clock() {
    const next = !clocked;
    setClocked(next);
    localStorage.setItem("eunik-clock", next ? "in" : "out");
    void db.attendance.clock(next ? "in" : "out").then(() => toast.success(next ? "Clocked in on the floor." : "Clocked out."));
  }

  async function advance(id: string, stage: ProductionStage) {
    if (!user) return;
    const next = nextLegalStage(stage, user.role);
    if (!next) {
      toast.error("That stage is not yours to advance.");
      return;
    }
    await db.production.moveStage(id, next);
    reload();
    toast.success(`Moved to ${statusLabel(next)}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Floor"
        title={`On your bench, ${user?.firstName}.`}
        subtitle="Advance only orders on your bench. No money screens here."
        actions={
          <OsButton variant={clocked ? "ghost" : "gold"} onClick={clock}>
            {clocked ? "Clock out" : "Clock in"}
          </OsButton>
        }
      />
      <DashNavGrid tiles={tiles} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="On bench" value={String(assigned.length)} />
        <StatCard label="Overdue / due soon" value={String(overdue.length)} tone={overdue.length ? "alert" : "plain"} />
        <StatCard label="Fittings" value={String(fittings?.filter((item) => item.status === "scheduled").length ?? 0)} />
      </div>
      <NeedAttention
        items={[
          ...overdue.map((item) => ({
            id: item.id,
            title: `${item.garment} needs the next stage`,
            detail: `Due ${item.dueDate} · ${statusLabel(item.stage)}`,
            href: "/atelier/queue",
          })),
          ...(fittings ?? [])
            .filter((item) => item.status === "scheduled")
            .map((item) => ({
              id: item.id,
              title: "Fitting on the book",
              detail: `${item.date} · ${item.notes}`,
              href: "/atelier/fittings",
            })),
        ]}
      />
      <SectionCard title="On your bench">
        <div className="grid gap-3 md:grid-cols-2">
          {assigned.length ? (
            assigned.map((item) => {
              const next = user ? nextLegalStage(item.stage, user.role) : null;
              return (
                <article key={item.id} className="rounded-xl border border-line p-4">
                  <p className="font-medium text-ink">{item.garment}</p>
                  <p className="mt-1 text-sm">
                    #{item.orderId.replace("order_", "")} · due {item.dueDate}
                  </p>
                  <StatusBadge label={statusLabel(item.stage)} tone={statusTone(item.stage)} />
                  {next ? (
                    <OsButton className="mt-3" variant="gold" onClick={() => void advance(item.id, item.stage)}>
                      Advance to {statusLabel(next)}
                    </OsButton>
                  ) : null}
                  <Link to="/atelier/queue" className="mt-2 block text-sm underline">
                    Open queue
                  </Link>
                </article>
              );
            })
          ) : (
            <p className="text-sm">Nothing on your bench right now.</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
