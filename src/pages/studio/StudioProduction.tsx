import { toast } from "sonner";
import { PageHeader, SectionCard, StatCard, StatusBadge, OsButton, ProgressBar } from "@/components/os/ui";
import { db, type ProductionStage } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/context/SessionProvider";
import { statusLabel, statusTone } from "@/lib/format";
import {
  ALL_STAGES,
  FLOOR_COLUMNS,
  WAITING_STAGES,
  isWaitingStage,
  nextLegalStage,
  nextStage,
} from "@/lib/productionStages";

function columnForStage(stage: ProductionStage): string {
  if (isWaitingStage(stage)) return "waiting";
  return stage;
}

export default function StudioProduction() {
  const { user } = useSession();
  const { data: board } = useAsync(() => db.production.listBoard(), []);
  const { data: staff } = useAsync(() => db.people.staff().catch(() => []), []);

  async function advance(id: string, stage: ProductionStage) {
    const role = user?.role ?? "manager";
    const next = nextLegalStage(stage, role) ?? nextStage(stage);
    await db.production.moveStage(id, next);
    toast.success(`Moved to ${statusLabel(next)}`);
  }

  const columns: { id: string; label: string; stages: ProductionStage[] }[] = [
    { id: "waiting", label: "Waiting", stages: WAITING_STAGES },
    ...FLOOR_COLUMNS.map((stage) => ({ id: stage, label: statusLabel(stage), stages: [stage] })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Production" subtitle="Advance an order on the floor. Clients see the same progress." />
      <div className="grid gap-4 sm:grid-cols-4">
        {columns.slice(0, 4).map((column) => (
          <StatCard
            key={column.id}
            label={column.label}
            value={String((board ?? []).filter((item) => column.stages.includes(item.stage)).length)}
          />
        ))}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((column) => (
          <SectionCard key={column.id} title={column.label} className="min-w-[240px] flex-1">
            {(board ?? [])
              .filter((item) => column.stages.includes(item.stage))
              .map((item) => {
                const canAdvance = user ? nextLegalStage(item.stage, user.role) : nextStage(item.stage);
                return (
                  <article key={item.id} className="mb-3 rounded-xl border border-line p-3 last:mb-0">
                    <p className="font-medium text-ink">{item.garment}</p>
                    <p className="text-xs">
                      #{item.orderId.replace("order_", "")} · {item.sku} · due {item.dueDate}
                    </p>
                    <div className="mt-2">
                      <ProgressBar value={((ALL_STAGES.indexOf(item.stage) + 1) / ALL_STAGES.length) * 100} gold />
                    </div>
                    {canAdvance ? (
                      <OsButton className="mt-3 w-full" variant="gold" onClick={() => void advance(item.id, item.stage)}>
                        Advance
                      </OsButton>
                    ) : null}
                    {staff?.length && user && ["super_admin", "manager"].includes(user.role) ? (
                      <select
                        className="mt-2 w-full rounded-lg border border-line px-2 py-1 text-xs"
                        defaultValue={item.assigneeId}
                        onChange={(event) => void db.production.assignTask(item.id, event.target.value)}
                      >
                        {staff.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </article>
                );
              })}
          </SectionCard>
        ))}
      </div>
      <SectionCard title="All floor orders">
        <ul className="space-y-2">
          {(board ?? []).map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
              <span>
                #{item.orderId.replace("order_", "")} {item.garment}
              </span>
              <StatusBadge label={statusLabel(columnForStage(item.stage))} tone={statusTone(item.stage)} />
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
