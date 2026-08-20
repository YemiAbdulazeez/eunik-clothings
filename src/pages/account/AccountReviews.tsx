import { type FormEvent, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Field, OsButton, PageHeader, SectionCard, StatusBadge, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { statusTone } from "@/lib/format";

export default function AccountReviews() {
  const { data: orders } = useAsync(() => db.orders.listMine(), []);
  const { data: reviews } = useAsync(() => db.reviews.listMine(), []);
  const [busy, setBusy] = useState(false);
  const reviewable = (orders ?? []).filter(
    (item) => item.productId && (item.status === "delivered" || item.status === "ready"),
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await db.reviews.create({
        productId: String(data.get("productId")),
        rating: Number(data.get("rating")),
        body: String(data.get("body")),
      });
      toast.success("Review sent. The house publishes after a look.");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" subtitle="Tell the house how the cloth sat after delivery." />
      <SectionCard title="Write a review">
        {reviewable.length ? (
          <form onSubmit={(event) => void submit(event)} className="grid gap-3 md:grid-cols-2">
            <Field label="Look">
              <select name="productId" required className={inputClass}>
                {reviewable.map((item) => (
                  <option key={item.id} value={item.productId}>
                    #{item.number} {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stars">
              <select name="rating" defaultValue="5" className={inputClass}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="How it wore">
                <textarea name="body" required rows={3} className={inputClass} />
              </Field>
            </div>
            <OsButton type="submit" disabled={busy}>
              Send review
            </OsButton>
          </form>
        ) : (
          <p className="text-sm">Delivered catalogue looks can be reviewed here.</p>
        )}
      </SectionCard>
      {!reviews?.length ? (
        <EmptyState title="No reviews yet" text="When a ticket is delivered, the look appears above." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(reviews ?? []).map((item) => (
            <SectionCard
              key={item.id}
              title={item.customerName}
              action={<StatusBadge label={item.status} tone={statusTone(item.status)} />}
            >
              <p className="flex items-center gap-1 text-sm text-ink">
                <Star className="h-4 w-4 fill-gold text-gold" /> {item.rating} / 5
              </p>
              <p className="mt-2 text-sm">{item.body}</p>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
