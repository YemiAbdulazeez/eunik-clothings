import { toast } from "sonner";
import { OsButton, PageHeader, PageLoading, ProgressBar, SectionCard, StatusBadge } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { statusLabel, statusTone } from "@/lib/format";
import { ALL_STAGES, canAdvanceStage, nextLegalStage } from "@/lib/productionStages";

export default function AtelierQueue() {
  const { user } = useSession();
  const { data: board, loading } = useAsync(() => db.production.listBoard(), []);

  if (loading && !board) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader title="Queue" subtitle="Due dates and stage. Advance from the bench." />
      <SectionCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2">Garment</th>
                <th>Stage</th>
                <th>Due</th>
                <th>Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(board ?? []).map((item) => {
                const index = Math.max(0, ALL_STAGES.indexOf(item.stage));
                const role = user?.role ?? "client";
                const canAdvance = canAdvanceStage(item.stage, role);
                const next = nextLegalStage(item.stage, role);
                return (
                  <tr key={item.id} className="border-b border-line/60">
                    <td className="py-3 text-ink">
                      #{item.orderId.replace("order_", "")} {item.garment}
                    </td>
                    <td>
                      <StatusBadge label={statusLabel(item.stage)} tone={statusTone(item.stage)} />
                    </td>
                    <td>{item.dueDate}</td>
                    <td className="w-40">
                      <ProgressBar value={((index + 1) / ALL_STAGES.length) * 100} gold />
                    </td>
                    <td>
                      {canAdvance && next ? (
                        <OsButton
                          variant="gold"
                          onClick={() =>
                            db.production
                              .moveStage(item.id, next)
                              .then(() => toast.success(`Now ${statusLabel(next)}`))
                              .catch((error) => toast.error(error instanceof Error ? error.message : "Cannot advance."))
                          }
                        >
                          Advance
                        </OsButton>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
