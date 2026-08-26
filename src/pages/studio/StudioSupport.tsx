import { useState } from "react";
import { toast } from "sonner";
import { Field, OsButton, PageHeader, PageLoading, SectionCard, StatusBadge, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { statusTone } from "@/lib/format";

export default function StudioSupport() {
  const { data: tickets, loading, reload: reloadTickets } = useAsync(() => db.tickets.list(), []);
  const { data: reviews, reload: reloadReviews } = useAsync(() => db.reviews.listAll().catch(() => []), []);
  const [reply, setReply] = useState<Record<string, string>>({});

  if (loading && !tickets) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer support"
        subtitle="Desk inbox and magazine reviews waiting to go live."
        onRefresh={() => Promise.all([reloadTickets(), reloadReviews()])}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {(tickets ?? []).map((item) => (
          <SectionCard
            key={item.id}
            title={item.subject}
            action={<StatusBadge label={item.status} tone={statusTone(item.status)} />}
          >
            <p className="text-sm text-ink">
              {item.name} · {item.email} · {item.phone}
            </p>
            <p className="mt-2 text-sm">{item.message}</p>
            {item.replies.map((line) => (
              <p key={line.at} className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm">
                {line.body}
              </p>
            ))}
            <Field label="Reply">
              <textarea
                className={`mt-2 ${inputClass}`}
                value={reply[item.id] ?? ""}
                onChange={(event) => setReply((current) => ({ ...current, [item.id]: event.target.value }))}
              />
            </Field>
            <div className="mt-3 flex gap-2">
              <OsButton
                loadingText="Sending…"
                onClick={async () => {
                  await db.tickets.reply(item.id, reply[item.id] ?? "");
                  toast.success("Replied.");
                  setReply((current) => ({ ...current, [item.id]: "" }));
                  await reloadTickets();
                }}
              >
                Send
              </OsButton>
              {item.status === "open" ? (
                <OsButton
                  variant="ghost"
                  loadingText="Closing…"
                  onClick={async () => {
                    await db.tickets.setStatus(item.id, "closed");
                    toast.message("Ticket closed.");
                    await reloadTickets();
                  }}
                >
                  Close
                </OsButton>
              ) : null}
            </div>
          </SectionCard>
        ))}
      </div>
      <SectionCard title="Reviews to moderate">
        <ul className="space-y-3">
          {(reviews ?? []).map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
              <div>
                <p className="text-ink">
                  {item.customerName} · {item.rating}/5
                </p>
                <p className="text-sm">{item.body}</p>
                <StatusBadge label={item.status} tone={statusTone(item.status)} />
              </div>
              {item.status === "pending" ? (
                <div className="flex gap-2">
                  <OsButton
                    variant="gold"
                    loadingText="Publishing…"
                    onClick={async () => {
                      await db.reviews.moderate(item.id, "approved");
                      toast.success("Published.");
                      await reloadReviews();
                    }}
                  >
                    Publish
                  </OsButton>
                  <OsButton
                    variant="ghost"
                    loadingText="Holding…"
                    onClick={async () => {
                      await db.reviews.moderate(item.id, "rejected");
                      toast.message("Held.");
                      await reloadReviews();
                    }}
                  >
                    Hold
                  </OsButton>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
