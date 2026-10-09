import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Field, OsButton, PageHeader, PageLoading, SectionCard, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import type { DailyReport, ProductionItemType } from "@/db/types";
import { useAsync } from "@/hooks/useAsync";

export default function StudioDailyReport() {
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  const { data: types, loading: typesLoading } = useAsync(
    () => db.dailyReports.types() as Promise<ProductionItemType[]>,
    [],
  );
  const { data: mine, loading: mineLoading, reload } = useAsync(
    () => db.dailyReports.mine(workDate) as Promise<{ report: DailyReport | null; workDate: string }>,
    [workDate],
  );

  useEffect(() => {
    const report = mine?.report;
    if (!report) {
      setNotes("");
      setQty({});
      return;
    }
    setNotes(report.notes ?? "");
    const next: Record<string, number> = {};
    for (const line of report.lines) next[line.itemTypeId] = line.qty;
    setQty(next);
  }, [mine]);

  const groups = useMemo(() => {
    const map = new Map<string, ProductionItemType[]>();
    for (const item of types ?? []) {
      const key = item.groupKey || "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return [...map.entries()];
  }, [types]);

  if ((typesLoading || mineLoading) && !types) return <PageLoading />;

  async function save() {
    if (!types?.length) return;
    const lines = types.map((item) => ({
      itemTypeId: item.id,
      qty: Math.max(0, Math.floor(Number(qty[item.id]) || 0)),
    }));
    const total = lines.reduce((n, l) => n + l.qty, 0);
    if (total === 0) {
      const ok = window.confirm("All quantities are 0 — save as a no-production day?");
      if (!ok) return;
    }
    setBusy(true);
    try {
      await db.dailyReports.save({ workDate, notes: notes.trim() || undefined, lines });
      toast.success("Daily report saved.");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save report.");
    } finally {
      setBusy(false);
    }
  }

  const groupTitle: Record<string, string> = {
    tops: "Tops / shirts / suits",
    pants: "Pants / shorts",
    agbada: "Agbada",
    caps: "Caps",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily report"
        subtitle="Key how many of each look you completed today. Used for weekly review."
        onRefresh={() => reload()}
      />
      <SectionCard title="Date">
        <Field label="Work date">
          <input
            type="date"
            className={inputClass}
            value={workDate}
            onChange={(event) => setWorkDate(event.target.value)}
          />
        </Field>
        <div className="mt-3">
          <Field label="Notes (optional)">
            <input
              className={inputClass}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional note for the day"
            />
          </Field>
        </div>
      </SectionCard>
      {groups.map(([key, items]) => (
        <SectionCard key={key} title={groupTitle[key] ?? key}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Field key={item.id} label={item.label}>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className={inputClass}
                  value={qty[item.id] ?? 0}
                  onChange={(event) =>
                    setQty((prev) => ({
                      ...prev,
                      [item.id]: Math.max(0, Math.floor(Number(event.target.value) || 0)),
                    }))
                  }
                />
              </Field>
            ))}
          </div>
        </SectionCard>
      ))}
      <OsButton loading={busy} loadingText="Saving…" onClick={() => void save()}>
        Save daily report
      </OsButton>
    </div>
  );
}
