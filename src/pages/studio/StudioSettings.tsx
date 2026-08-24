import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Field, OsButton, PageHeader, PageLoading, SectionCard, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/context/SessionProvider";
import { nairaToKobo } from "@/lib/money";

export default function StudioSettings() {
  const navigate = useNavigate();
  const { user } = useSession();
  const isPrincipal = user?.role === "super_admin";
  const { data: settings, reload, loading } = useAsync(() => db.settings.get(), []);
  const { data: logs } = useAsync(
    () => (isPrincipal || user?.role === "manager" ? db.audit.list() : Promise.resolve([])),
    [user?.role],
  );
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (!window.confirm("Reset local presentation data? Live Postgres data is not wiped.")) return;
    await db.reset();
    toast.success("Local store reset. Sign in again.");
    navigate("/studio/login");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isPrincipal || !settings) return;
    const data = new FormData(event.currentTarget);
    const freeShippingNaira = Number(data.get("freeShippingNaira") || 0);
    setBusy(true);
    try {
      await db.settings.update({
        company: String(data.get("company") ?? ""),
        rc: String(data.get("rc") ?? ""),
        phone: String(data.get("phone") ?? ""),
        email: String(data.get("email") ?? ""),
        whatsapp: String(data.get("whatsapp") ?? ""),
        instagram: String(data.get("instagram") ?? ""),
        siteUrl: String(data.get("siteUrl") ?? ""),
        address: String(data.get("address") ?? ""),
        pickupLocation: String(data.get("pickupLocation") ?? ""),
        aboutJoinLine: String(data.get("aboutJoinLine") ?? ""),
        depositPercent: Number(data.get("depositPercent") || 50),
        freeShippingKobo: nairaToKobo(freeShippingNaira),
        demoMode: data.get("demoMode") === "on",
        bank: {
          bankName: String(data.get("bankName") ?? ""),
          accountName: String(data.get("accountName") ?? ""),
          accountNumber: String(data.get("accountNumber") ?? ""),
          narrationHint: String(data.get("narrationHint") ?? ""),
        },
      });
      toast.success("House settings saved.");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (loading && !settings) return <PageLoading />;
  if (!settings) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle={
          isPrincipal
            ? "Company profile, bank details, and house defaults. Changes apply across the site."
            : "House presentation. Only the principal can edit company and bank details."
        }
      />

      {isPrincipal ? (
        <form onSubmit={(event) => void save(event)} className="space-y-6">
          <SectionCard title="Company">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Company name">
                <input name="company" defaultValue={settings.company} required className={inputClass} />
              </Field>
              <Field label="RC number">
                <input name="rc" defaultValue={settings.rc} className={inputClass} />
              </Field>
              <Field label="Phone">
                <input name="phone" defaultValue={settings.phone} className={inputClass} />
              </Field>
              <Field label="Email">
                <input name="email" type="email" defaultValue={settings.email} className={inputClass} />
              </Field>
              <Field label="WhatsApp (digits)">
                <input name="whatsapp" defaultValue={settings.whatsapp} className={inputClass} />
              </Field>
              <Field label="Instagram URL">
                <input name="instagram" defaultValue={settings.instagram} className={inputClass} />
              </Field>
              <Field label="Site URL">
                <input name="siteUrl" defaultValue={settings.siteUrl} className={inputClass} />
              </Field>
              <Field label="Address">
                <input name="address" defaultValue={settings.address} className={inputClass} />
              </Field>
              <Field label="Pickup location">
                <input name="pickupLocation" defaultValue={settings.pickupLocation} className={inputClass} />
              </Field>
              <Field label="About / trust line">
                <input name="aboutJoinLine" defaultValue={settings.aboutJoinLine} className={inputClass} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Bank account (checkout transfers)">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Bank name">
                <input name="bankName" defaultValue={settings.bank.bankName} required className={inputClass} />
              </Field>
              <Field label="Account name">
                <input name="accountName" defaultValue={settings.bank.accountName} required className={inputClass} />
              </Field>
              <Field label="Account number">
                <input name="accountNumber" defaultValue={settings.bank.accountNumber} required className={inputClass} />
              </Field>
              <Field label="Narration hint">
                <input name="narrationHint" defaultValue={settings.bank.narrationHint} className={inputClass} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Orders & shipping">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Deposit percent">
                <input
                  name="depositPercent"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={settings.depositPercent}
                  className={inputClass}
                />
              </Field>
              <Field label="Free shipping from (₦)">
                <input
                  name="freeShippingNaira"
                  type="number"
                  min={0}
                  defaultValue={Math.round(settings.freeShippingKobo / 100)}
                  className={inputClass}
                />
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="demoMode" defaultChecked={settings.demoMode} />
              Demo mode (presentation switcher / banners)
            </label>
          </SectionCard>

          <OsButton type="submit" loading={busy} loadingText="Saving…">
            Save settings
          </OsButton>
        </form>
      ) : (
        <SectionCard title="House">
          <p className="text-ink">{settings.company}</p>
          <p className="text-sm">
            RC {settings.rc} · {settings.pickupLocation}
          </p>
          <p className="mt-2 text-sm text-muted">Ask the house principal to change company or bank details.</p>
        </SectionCard>
      )}

      <SectionCard title="Local presentation">
        <p className="text-sm">
          Reset only clears the browser demo store. Live catalog, settings, and orders stay in Postgres.
        </p>
        <div className="mt-4">
          <OsButton variant="ghost" onClick={() => reset()}>
            Reset local presentation data
          </OsButton>
        </div>
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
