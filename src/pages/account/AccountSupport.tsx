import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { EmptyState, Field, OsButton, PageHeader, PageLoading, SectionCard, StatusBadge, inputClass } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { statusLabel, statusTone } from "@/lib/format";

export default function AccountSupport() {
  const { user } = useSession();
  const { data: tickets, loading, reload } = useAsync(() => db.tickets.listMine(), []);
  const [busy, setBusy] = useState(false);

  if (loading && !tickets) return <PageLoading />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await db.tickets.create({
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        subject: String(data.get("subject")),
        message: String(data.get("message")),
      });
      toast.success("Desk has the note.");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer support"
        subtitle="The Ibadan desk reads these. Stay on this book — no need to leave."
        onRefresh={() => reload()}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="New message">
          <form onSubmit={(event) => void submit(event)} className="space-y-3">
            <Field label="Subject">
              <input name="subject" required className={inputClass} />
            </Field>
            <Field label="Message">
              <textarea name="message" required rows={5} className={inputClass} />
            </Field>
            <OsButton type="submit" disabled={busy}>
              Send to desk
            </OsButton>
          </form>
        </SectionCard>
        <SectionCard title="Your messages">
          {!tickets?.length ? (
            <EmptyState title="Quiet desk" text="Ask about a fitting, balance or alteration." />
          ) : (
            <ul className="space-y-3">
              {(tickets ?? []).map((item) => (
                <li key={item.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-ink">{item.subject}</p>
                    <StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />
                  </div>
                  <p className="mt-1 text-sm">{item.message}</p>
                  {item.replies.map((reply) => (
                    <p key={reply.at} className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm">
                      House · {reply.body}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
