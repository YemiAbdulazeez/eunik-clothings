import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import ImageUpload, { ImageUploadList } from "@/components/os/ImageUpload";
import ProductImageSlider, { productGallery } from "@/components/ProductImageSlider";
import { EmptyState, Field, OsButton, PageHeader, PageLoading, SectionCard, StatusBadge, inputClass } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira, nairaToKobo } from "@/lib/money";
import { statusTone } from "@/lib/format";
import { useSession } from "@/context/SessionProvider";
import { canDeleteProducts } from "@/lib/rbac";

export default function StudioProducts() {
  const { id } = useParams();
  const { data: products, loading: listLoading, reload: reloadProducts } = useAsync(
    () => db.products.listAll().catch(() => db.products.list()),
    [],
  );
  const { data: categories, reload: reloadCategories } = useAsync(() => db.categories.list(), []);
  const isNew = id === "new";
  const isForm = Boolean(id);
  const { data: fetched, loading: fetchLoading } = useAsync(
    () =>
      id && !isNew
        ? db.products.getById(id).catch(() => null)
        : Promise.resolve(null),
    [id, isNew],
  );

  const fromList =
    id && !isNew
      ? (products ?? []).find((item) => {
          const key = id.trim().toLowerCase();
          return (
            item.id.trim().toLowerCase() === key ||
            item.sku.trim().toLowerCase() === key ||
            item.slug.trim().toLowerCase() === key
          );
        })
      : null;
  const editing = fetched ?? fromList ?? null;
  const loading = listLoading || (Boolean(id) && !isNew && fetchLoading);

  if (isForm) {
    if (!isNew && loading) {
      return <PageLoading />;
    }
    if (!isNew && !editing) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted">That look was not found on the rail.</p>
          <Link to="/studio/products" className="os-pill border border-line">
            Back to products
          </Link>
        </div>
      );
    }
    return <ProductForm key={editing?.id ?? id} existing={editing ?? null} isNew={isNew} categories={categories ?? []} />;
  }

  if (listLoading && !products) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Standalone catalogue. Price in naira, or mark request-for-price. Images upload from your device."
        onRefresh={() => Promise.all([reloadProducts(), reloadCategories()])}
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
            <Link key={item.id} to={`/studio/products/${encodeURIComponent(item.id.trim())}`}>
              <SectionCard className="overflow-hidden p-0">
                <ProductImageSlider images={productGallery(item)} alt={item.name} />
                <div className="space-y-1 p-5">
                  <p className="os-label">
                    {item.sku}
                    {item.featuredRank > 0 ? ` · #${item.featuredRank}` : ""}
                  </p>
                  <p className="font-alt text-lg text-ink">{item.name}</p>
                  <p className="mt-1 text-sm">
                    {item.priceOnRequest ? "Request for price" : formatNaira(item.priceKobo)}
                  </p>
                  <StatusBadge label={item.status} tone={statusTone(item.status)} />
                </div>
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
  const [images, setImages] = useState<string[]>(() => {
    const list = existing?.images?.length ? existing.images : existing?.image ? [existing.image] : [];
    return [...new Set(list.filter(Boolean))];
  });
  const [quote, setQuote] = useState(Boolean(existing?.priceOnRequest));
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState(existing?.category ?? categories[0]?.slug ?? "");
  const [sku, setSku] = useState(existing?.sku ?? "");
  const [skuBusy, setSkuBusy] = useState(false);
  const [position, setPosition] = useState(
    existing?.featuredRank && existing.featuredRank > 0 ? existing.featuredRank : 0,
  );
  const [positionHint, setPositionHint] = useState("");

  useEffect(() => {
    if (!isNew || !category) return;
    let alive = true;
    setSkuBusy(true);
    void db.products
      .nextSku(category)
      .then((result) => {
        if (alive) setSku(result.sku);
      })
      .catch(() => {
        if (alive) setSku("");
      })
      .finally(() => {
        if (alive) setSkuBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [category, isNew]);

  useEffect(() => {
    if (!isNew || existing) return;
    setPosition(0);
    setPositionHint("Leave 0 for newest-first. Set 6 to force this look into the 6th slot.");
  }, [isNew, existing]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!images.length) {
      toast.error("Upload at least one garment image.");
      return;
    }
    if (!category) {
      toast.error("Choose a collection first.");
      return;
    }
    if (!existing && !sku) {
      toast.error("SKU is still generating — wait a moment.");
      return;
    }
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const uniqueImages = [...new Set(images.filter(Boolean))];
      const payload = {
        sku: existing ? existing.sku : sku,
        name: String(data.get("name")),
        image: uniqueImages[0],
        images: uniqueImages,
        category,
        priceKobo: quote ? 0 : nairaToKobo(Number(data.get("price") || 0)),
        priceOnRequest: quote,
        shortDescription: String(data.get("shortDescription")),
        description: String(data.get("description")),
        colour: String(data.get("colour")),
        fabricLabel: String(data.get("fabricLabel")),
        sellsRtw: data.get("sellsRtw") === "on",
        sellsMtm: data.get("sellsMtm") === "on",
        featuredRank: Math.max(0, Math.floor(Number(data.get("featuredRank") || position || 0))),
        status: (data.get("status") === "draft" ? "draft" : "live") as "live" | "draft",
      };
      if (existing) {
        await db.products.update(existing.id, payload);
        toast.success("Look updated.");
      } else {
        await db.products.create(payload);
        toast.success(`Look ${sku} added to the rail.`);
      }
      navigate("/studio/products");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing || busy) return;
    if (!confirm("Delete this look from the rail?")) return;
    setBusy(true);
    try {
      await db.products.remove(existing.id);
      toast.message("Removed.");
      navigate("/studio/products");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product file"
        title={existing ? `Edit ${existing.sku}` : "Add a product"}
        subtitle="Choose the collection first — SKU is assigned automatically (e.g. AGB-000234). Request-for-price hides the naira until desk quotes."
        actions={
          <Link to="/studio/products" className="os-pill border border-line">
            Back to rail
          </Link>
        }
      />
      <form onSubmit={(event) => void save(event)} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <SectionCard title="Details">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Collection">
              <select
                name="category"
                required
                value={category}
                disabled={!isNew && Boolean(existing)}
                onChange={(event) => setCategory(event.target.value)}
                className={inputClass}
              >
                {!categories.length ? <option value="">No collections yet</option> : null}
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="SKU (auto)">
              <input
                name="sku"
                required
                value={sku}
                readOnly
                disabled={skuBusy}
                className={`${inputClass} bg-paper`}
                placeholder={skuBusy ? "Assigning…" : "Pick a collection"}
              />
            </Field>
            <Field label="Name">
              <input name="name" required defaultValue={existing?.name} className={inputClass} />
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
                <input
                  name="price"
                  type="number"
                  required
                  defaultValue={existing && !existing.priceOnRequest ? existing.priceKobo / 100 : 95000}
                  className={inputClass}
                />
              </Field>
            ) : null}
            <Field label="Home / shop position">
              <input
                name="featuredRank"
                type="number"
                min={0}
                step={1}
                value={position}
                onChange={(event) => setPosition(Math.max(0, Math.floor(Number(event.target.value) || 0)))}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted">
                New looks appear first by date. Set a number to pin this look into that slot
                (e.g. 6 = sixth on home and shop), even if it is brand new. Use 0 for natural
                newest-first order. Claiming a slot bumps other pinned looks at that position or below.
                {positionHint ? ` ${positionHint}` : ""}
              </p>
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
          </SectionCard>
          <div className="flex flex-wrap gap-2">
            <OsButton type="submit" disabled={busy || skuBusy} loading={busy}>
              {existing ? "Save look" : "Add look"}
            </OsButton>
            {existing && canDelete ? (
              <OsButton variant="danger" loading={busy} loadingText="Deleting…" onClick={() => remove()}>
                Delete
              </OsButton>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}

