import { type FormEvent, useEffect, useRef, useState } from "react";
import { Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/os/ImageUpload";
import { Field, OsButton, PageError, PageHeader, PageLoading, SectionCard, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { slugify } from "@/lib/format";

export default function StudioCollections() {
  const { data: categories, loading, error, reload } = useAsync(() => db.categories.list(), []);
  const { data: counts, reload: reloadCounts } = useAsync(() => db.categories.counts(), []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const editing = (categories ?? []).find((item) => item.id === editingId) ?? null;

  useEffect(() => {
    if (!(creating || editing)) return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [creating, editingId, editing]);

  if (loading && !categories) return <PageLoading />;
  if (error && !categories) {
    return <PageError message={error} onRetry={() => Promise.all([reload(), reloadCounts()])} />;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const image = String(data.get("image") || "").trim();
    const tagline = String(data.get("tagline") || "").trim();
    const sortOrder = Math.max(0, Math.floor(Number(data.get("sortOrder") || 0)));
    if (!name) {
      toast.error("Collection name is required.");
      return;
    }
    if (!image) {
      toast.error("Upload a collection image.");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await db.categories.update(editing.id, { name, tagline, image, homeTileImage: image, sortOrder });
        toast.success("Collection updated.");
        setEditingId(null);
      } else {
        await db.categories.create({
          name,
          tagline,
          slug: slugify(String(data.get("slug") || name)),
          image,
          sortOrder,
        });
        toast.success("Collection added.");
        form.reset();
        setCreating(false);
      }
      await Promise.all([reload(), reloadCounts()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save collection.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, name: string) {
    if (deletingId || busy) return;
    if (!confirm(`Delete “${name}”? Looks in this collection stay on the rail but lose this grouping label.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await db.categories.remove(id);
      if (editingId === id) {
        setEditingId(null);
        setCreating(false);
      }
      toast.message("Collection removed.");
      await Promise.all([reload(), reloadCounts()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setDeletingId(null);
    }
  }

  function startCreate() {
    setCreating(true);
    setEditingId(null);
  }

  function startEdit(id: string) {
    setEditingId(id);
    setCreating(false);
  }

  function cancelForm() {
    if (busy) return;
    setCreating(false);
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        subtitle="Standalone rail — add, edit or delete a house collection. Set display order (higher = earlier on home)."
        onRefresh={() => Promise.all([reload(), reloadCounts()])}
        actions={
          <OsButton variant="gold" disabled={busy || Boolean(deletingId)} onClick={startCreate}>
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
              <OsButton
                variant="ghost"
                className="!min-h-0 !px-2 !py-1 text-sm underline"
                disabled={busy || Boolean(deletingId)}
                onClick={() => startEdit(item.id)}
              >
                Edit
              </OsButton>
            }
          >
            <div className="-mx-5 -mt-1 mb-3 overflow-hidden">
              <img src={item.image} alt="" className="aspect-[4/5] w-full object-cover" />
            </div>
            <p className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4" /> {counts?.[item.slug] ?? 0} looks · order {item.sortOrder ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted">{item.tagline}</p>
            <OsButton
              className="mt-3"
              variant="ghost"
              loading={deletingId === item.id}
              loadingText="Deleting…"
              disabled={busy || (Boolean(deletingId) && deletingId !== item.id)}
              onClick={() => remove(item.id, item.name)}
            >
              Delete
            </OsButton>
          </SectionCard>
        ))}
      </div>
      {creating || editing ? (
        <div ref={formRef}>
          <SectionCard title={editing ? `Edit ${editing.name}` : "Add collection"}>
            <form key={editing?.id ?? "new"} onSubmit={(event) => void save(event)} className="grid gap-3 md:grid-cols-2">
              <Field label="Name">
                <input name="name" required defaultValue={editing?.name} className={inputClass} disabled={busy} />
              </Field>
              {!editing ? (
                <Field label="Slug">
                  <input name="slug" placeholder="e.g. summer-heritage" className={inputClass} disabled={busy} />
                </Field>
              ) : null}
              <Field label="Tagline">
                <input name="tagline" defaultValue={editing?.tagline} className={inputClass} disabled={busy} />
              </Field>
              <Field label="Display order">
                <input
                  name="sortOrder"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={editing?.sortOrder ?? (categories?.length ?? 0) + 1}
                  className={inputClass}
                  disabled={busy}
                />
                <p className="mt-1 text-xs text-muted">Higher numbers appear first on the home rail.</p>
              </Field>
              <div className="md:col-span-2">
                <ImageUpload name="image" label="Cover image" value={editing?.image} folder="looks" />
              </div>
              <div className="flex flex-wrap gap-2">
                <OsButton type="submit" loading={busy} loadingText="Saving…">
                  Save
                </OsButton>
                <OsButton variant="ghost" disabled={busy} onClick={cancelForm}>
                  Cancel
                </OsButton>
              </div>
            </form>
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}
