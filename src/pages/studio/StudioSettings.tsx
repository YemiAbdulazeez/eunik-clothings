import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { OsButton, PageHeader, SectionCard } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/context/SessionProvider";

export default function StudioSettings() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const { data: logs } = useAsync(() => (user?.role === "super_admin" || user?.role === "manager" ? db.audit.list() : Promise.resolve([])), [user?.role]);

  async function reset() {
    if (!window.confirm("Reset all presentation data to Ade’s sewing story?")) return;
    await db.reset();
    toast.success("Demo reset. Sign in again.");
    navigate("/studio/login");
  }

  async function toggleDemo() {
    if (!settings) return;
    await db.settings.update({ demoMode: !settings.demoMode });
    toast.success(settings.demoMode ? "Demo switcher hidden." : "Demo switcher visible.");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="House presentation controls. Contact details live in Content." />
      <SectionCard title="Demo">
        <p className="text-sm">Storage key eunik-demo-db. Reset restores Ade #1001, Funmi’s transfer, and the cutting rail.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <OsButton onClick={() => void reset()}>Reset presentation data</OsButton>
          {user?.role === "super_admin" ? (
            <OsButton variant="ghost" onClick={() => void toggleDemo()}>
              Demo mode: {settings?.demoMode ? "on" : "off"}
            </OsButton>
          ) : null}
        </div>
      </SectionCard>
      <SectionCard title="House">
        <p className="text-ink">{settings?.company}</p>
        <p className="text-sm">
          RC {settings?.rc} · {settings?.pickupLocation}
        </p>
        {settings?.demoToday ? <p className="mt-2 text-xs text-muted">Demo “today” anchor: {settings.demoToday}</p> : null}
      </SectionCard>
      {logs && logs.length > 0 ? (
        <SectionCard title="Audit log">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2">When</th>
                  <th>Action</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 40).map((entry) => (
                  <tr key={entry.id} className="border-b border-line/60">
                    <td className="py-2 text-xs">{new Date(entry.at).toLocaleString()}</td>
                    <td>{entry.action}</td>
                    <td className="text-muted">{entry.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
