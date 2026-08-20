import { type FormEvent, useState } from "react";
import { Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/os/ImageUpload";
import { Field, OsButton, PageHeader, SectionCard, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { slugify } from "@/lib/format";

export default function StudioCollections() {
  const { data: categories } = useAsync(() => db.categories.list(), []);
  const { data: counts } = useAsync(() => db.categories.counts(), []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const editing = (categories ?? []).find((item) => item.id === editingId) ?? null;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name"));
    const image = String(data.get("image"));
    const tagline = String(data.get("tagline"));
    if (!image) {
      toast.error("Upload a collection image.");
      return;
    }
    try {
      if (editing) {
        await db.categories.update(editing.id, { name, tagline, image, homeTileImage: image });
        toast.success("Collection updated.");
        setEditingId(null);
      } else {
        await db.categories.create({
          name,
          tagline,
          slug: slugify(String(data.get("slug") || name)),
          image,
        });
        toast.success("Collection added.");
        setCreating(false);
      }
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save collection.");
    }
  }

  async function remove(id: string) {
    try {
      await db.categories.remove(id);
      toast.message("Collection removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        subtitle="Standalone rail — add, edit or delete a house collection. Not part of Content."
        actions={
          <OsButton variant="gold" onClick={() => { setCreating(true); setEditingId(null); }}>
            <Plus className="h-4 w-4" /> New collection
          </OsButton>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(categories ?? []).map((item) => (
          <SectionCard
            key={item.id}
            title={item.name}
            action={
              <button type="button" className="text-sm underline" onClick={() => { setEditingId(item.id); setCreating(false); }}>
                Edit
              </button>
            }
          >
            <img src={item.image} alt="" className="mb-3 h-36 w-full rounded-xl object-cover" />
            <p className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4" /> {counts?.[item.slug] ?? 0} looks · {item.tagline}
            </p>
            <OsButton className="mt-3" variant="ghost" onClick={() => void remove(item.id)}>
              Delete
            </OsButton>
          </SectionCard>
        ))}
      </div>
      {creating || editing ? (
        <SectionCard title={editing ? `Edit ${editing.name}` : "Add collection"}>
          <form key={editing?.id ?? "new"} onSubmit={(event) => void save(event)} className="grid gap-3 md:grid-cols-2">
            <Field label="Name">
              <input name="name" required defaultValue={editing?.name} className={inputClass} />
            </Field>
            {!editing ? (
              <Field label="Slug">
                <input name="slug" placeholder="e.g. summer-heritage" className={inputClass} />
              </Field>
            ) : null}
            <Field label="Tagline">
              <input name="tagline" defaultValue={editing?.tagline} className={inputClass} />
            </Field>
            <div className="md:col-span-2">
              <ImageUpload name="image" label="Cover image" value={editing?.image} />
            </div>
            <div className="flex gap-2">
              <OsButton type="submit">Save</OsButton>
              <OsButton
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </OsButton>
            </div>
          </form>
        </SectionCard>
      ) : null}
    </div>
  );
}
