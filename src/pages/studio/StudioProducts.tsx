import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Shirt } from "lucide-react";
import { toast } from "sonner";
import ImageUpload, { ImageUploadList } from "@/components/os/ImageUpload";
import { EmptyState, Field, OsButton, PageHeader, SectionCard, StatusBadge, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira, nairaToKobo } from "@/lib/money";
import { statusTone } from "@/lib/format";
import { useSession } from "@/context/SessionProvider";
import { canDeleteProducts } from "@/lib/rbac";

export default function StudioProducts() {
  const { id } = useParams();
  const { data: products, loading } = useAsync(() => db.products.listAll().catch(() => db.products.list()), []);
  const { data: categories } = useAsync(() => db.categories.list(), []);
  const editing = id && id !== "new" ? (products ?? []).find((item) => item.id === id) : null;
  const isForm = Boolean(id);

  if (isForm) {
    if (id !== "new" && loading) {
      return <p className="py-10 text-center text-sm text-muted">Opening look…</p>;
    }
    if (id !== "new" && !editing) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted">That look was not found on the rail.</p>
          <Link to="/studio/products" className="os-pill border border-line">
            Back to products
          </Link>
        </div>
      );
    }
    return <ProductForm key={id} existing={editing ?? null} isNew={id === "new"} categories={categories ?? []} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Standalone catalogue. Price in naira, or mark request-for-price. Images upload from your device."
        actions={
          <Link to="/studio/products/new" className="os-pill inline-flex bg-gold text-ink">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        }
      />
      {!products?.length ? (
        <EmptyState title="Empty rail" text="Add the first look with cloth photos." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(products ?? []).map((item) => (
            <Link key={item.id} to={`/studio/products/${item.id}`}>
              <SectionCard>
                <img src={item.image} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />
                <p className="os-label">{item.sku}</p>
                <p className="font-alt text-lg text-ink">{item.name}</p>
                <p className="mt-1 text-sm">
                  {item.priceOnRequest ? "Request for price" : formatNaira(item.priceKobo)}
                </p>
                <StatusBadge label={item.status} tone={statusTone(item.status)} />
              </SectionCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({
  existing,
  isNew,
  categories,
}: {
  existing: NonNullable<Awaited<ReturnType<typeof db.products.listAll>>>[number] | null;
  isNew: boolean;
  categories: Awaited<ReturnType<typeof db.categories.list>>;
}) {
  const navigate = useNavigate();
  const { user } = useSession();
  const canDelete = user ? canDeleteProducts(user) : false;
  const [images, setImages] = useState<string[]>(existing?.images?.length ? existing.images : existing?.image ? [existing.image] : []);
  const [quote, setQuote] = useState(Boolean(existing?.priceOnRequest));
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!images.length) {
      toast.error("Upload at least one garment image.");
      return;
    }
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const payload = {
        sku: String(data.get("sku")),
        name: String(data.get("name")),
        image: images[0],
        images,
        category: String(data.get("category")),
        priceKobo: quote ? 0 : nairaToKobo(Number(data.get("price") || 0)),
        priceOnRequest: quote,
        shortDescription: String(data.get("shortDescription")),
        description: String(data.get("description")),
        colour: String(data.get("colour")),
        fabricLabel: String(data.get("fabricLabel")),
        sellsRtw: data.get("sellsRtw") === "on",
        sellsMtm: data.get("sellsMtm") === "on",
        featuredRank: Number(data.get("featuredRank") || 0),
        status: (data.get("status") === "draft" ? "draft" : "live") as "live" | "draft",
      };
      if (existing) {
        await db.products.update(existing.id, payload);
        toast.success("Look updated.");
      } else {
        await db.products.create(payload);
        toast.success("Look added to the rail.");
      }
      navigate("/studio/products");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing) return;
    if (!confirm("Delete this look from the rail?")) return;
    await db.products.remove(existing.id);
    toast.message("Removed.");
    navigate("/studio/products");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product file"
        title={existing ? `Edit ${existing.sku}` : "Add a product"}
        subtitle="Uploads, not URL fields. Request-for-price hides the naira until desk quotes."
        actions={
          <Link to="/studio/products" className="os-pill border border-line">
            Back to rail
          </Link>
        }
      />
      <form onSubmit={(event) => void save(event)} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <SectionCard title="Details">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="SKU">
              <input name="sku" required defaultValue={existing?.sku} disabled={!isNew && Boolean(existing)} className={inputClass} />
            </Field>
            <Field label="Name">
              <input name="name" required defaultValue={existing?.name} className={inputClass} />
            </Field>
            <Field label="Collection">
              <select name="category" defaultValue={existing?.category ?? categories[0]?.slug} className={inputClass}>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Colour">
              <input name="colour" defaultValue={existing?.colour} className={inputClass} />
            </Field>
            <Field label="Fabric">
              <input name="fabricLabel" defaultValue={existing?.fabricLabel ?? "Senator cloth"} className={inputClass} />
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={existing?.status ?? "live"} className={inputClass}>
                <option value="live">Live</option>
                <option value="draft">Draft</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={quote} onChange={(event) => setQuote(event.target.checked)} />
                Request for price (no naira on shop)
              </label>
            </div>
            {!quote ? (
              <Field label="Price ₦">
                <input name="price" type="number" required defaultValue={existing && !existing.priceOnRequest ? existing.priceKobo / 100 : 95000} className={inputClass} />
              </Field>
            ) : null}
            <Field label="Featured rank (0 = off)">
              <input name="featuredRank" type="number" defaultValue={existing?.featuredRank ?? 0} className={inputClass} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Short line">
                <input name="shortDescription" defaultValue={existing?.shortDescription} className={inputClass} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea name="description" rows={4} defaultValue={existing?.description} className={inputClass} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="sellsRtw" defaultChecked={existing?.sellsRtw ?? true} /> Ready to wear
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="sellsMtm" defaultChecked={existing?.sellsMtm ?? true} /> Made to measure / pre-order
            </label>
          </div>
        </SectionCard>
        <div className="space-y-4">
          <SectionCard title="Images">
            <ImageUploadList label="Garment photos" values={images} onChange={setImages} folder="looks" />
            {!images.length ? (
              <div className="mt-3">
                <ImageUpload label="First photo" folder="looks" onChange={(url) => setImages([url])} />
              </div>
            ) : null}
            <p className="mt-2 flex items-center gap-2 text-xs">
              <Shirt className="h-3 w-3" /> Files stay on this device in the demo book.
            </p>
          </SectionCard>
          <div className="flex flex-wrap gap-2">
            <OsButton type="submit" disabled={busy}>
              {existing ? "Save look" : "Add look"}
            </OsButton>
            {existing && canDelete ? (
              <OsButton variant="danger" onClick={() => void remove()}>
                Delete
              </OsButton>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
