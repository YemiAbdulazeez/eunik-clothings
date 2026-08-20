import { useState } from "react";
import { toast } from "sonner";
import { Field, OsButton, PageHeader, SectionCard, StatusBadge, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { statusTone } from "@/lib/format";

export default function StudioSupport() {
  const { data: tickets } = useAsync(() => db.tickets.list(), []);
  const { data: reviews } = useAsync(() => db.reviews.listAll().catch(() => []), []);
  const [reply, setReply] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <PageHeader title="Customer support" subtitle="Desk inbox and magazine reviews waiting to go live." />
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
                onClick={() =>
                  void db.tickets.reply(item.id, reply[item.id] ?? "").then(() => {
                    toast.success("Replied.");
                    setReply((current) => ({ ...current, [item.id]: "" }));
                  })
                }
              >
                Send
              </OsButton>
              {item.status === "open" ? (
                <OsButton variant="ghost" onClick={() => void db.tickets.setStatus(item.id, "closed")}>
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
                  <OsButton variant="gold" onClick={() => void db.reviews.moderate(item.id, "approved")}>
                    Publish
                  </OsButton>
                  <OsButton variant="ghost" onClick={() => void db.reviews.moderate(item.id, "rejected")}>
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
