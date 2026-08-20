import { toast } from "sonner";
import { OsButton, PageHeader, SectionCard, StatusBadge } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { statusLabel, statusTone } from "@/lib/format";

export default function AtelierFittings() {
  const { data: fittings } = useAsync(() => db.fittings.list(), []);
  return (
    <div className="space-y-6">
      <PageHeader title="Fittings" subtitle="Mark done when the client has stood. Ready still needs QC." />
      <div className="grid gap-4 md:grid-cols-2">
        {(fittings ?? []).map((item) => (
          <SectionCard key={item.id} title={`Order ${item.orderId.replace("order_", "#")}`} action={<StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />}>
            <p className="text-ink">{item.date}</p>
            <p className="text-sm">{item.notes}</p>
            {item.status !== "done" ? (
              <OsButton className="mt-4" variant="gold" onClick={() => void db.fittings.update(item.id, { status: "done" }).then(() => toast.success("Fitting recorded."))}>
                Mark done
              </OsButton>
            ) : null}
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
