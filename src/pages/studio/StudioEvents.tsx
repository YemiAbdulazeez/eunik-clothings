import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import ImageUpload from "@/components/os/ImageUpload";
import { Field, OsButton, PageHeader, SectionCard, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { slugify } from "@/lib/format";

export default function StudioEvents() {
  const { data: events, reload } = useAsync(() => db.content.events(), []);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = (events ?? []).find((item) => item.id === editing);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name"));
    const image = String(data.get("image"));
    if (!image) {
      toast.error("Upload an event image.");
      return;
    }
    setBusy(true);
    try {
      await db.content.saveEvent({
        id: current?.id,
        slug: current?.slug ?? slugify(name),
        name,
        date: String(data.get("date")),
        location: String(data.get("location")),
        image,
        description: String(data.get("description")),
      });
      toast.success(current ? "Event updated." : "Event listed.");
      setEditing(null);
      event.currentTarget.reset();
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Event editor" subtitle="Trunk shows and house dates. Images upload from device." />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="On the calendar">
          <ul className="space-y-3">
            {(events ?? []).map((item) => (
              <li key={item.id} className="flex gap-3 rounded-xl border border-line p-3">
                <img src={item.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-sm">
                    {item.date} · {item.location}
                  </p>
                  <div className="mt-1 flex gap-3 text-sm">
                    <button type="button" className="underline" onClick={() => setEditing(item.id)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="underline"
                      onClick={() => db.content.removeEvent(item.id).then(() => toast.message("Removed."))}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title={current ? "Edit event" : "Add event"}>
          <form key={current?.id ?? "new"} onSubmit={(event) => void save(event)} className="space-y-3">
            <Field label="Name">
              <input name="name" required defaultValue={current?.name} className={inputClass} />
            </Field>
            <Field label="Date">
              <input name="date" type="date" required defaultValue={current?.date} className={inputClass} />
            </Field>
            <Field label="Location">
              <input name="location" defaultValue={current?.location ?? "Eunik HQ, Ibadan"} className={inputClass} />
            </Field>
            <ImageUpload name="image" label="Poster" value={current?.image} folder="events" />
            <Field label="Description">
              <textarea name="description" rows={3} defaultValue={current?.description} className={inputClass} />
            </Field>
            <OsButton type="submit" loading={busy} loadingText="Saving…">
              Save event
            </OsButton>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
