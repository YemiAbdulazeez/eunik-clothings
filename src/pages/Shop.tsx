import { useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ProductGrid from "@/components/ProductGrid";
import { PageHeader } from "@/components/os/ui";
import { db, type CategorySlug } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { inAccount } from "@/lib/osNav";

export default function Shop() {
  const location = useLocation();
  const embedded = inAccount(location.pathname);
  const [params] = useSearchParams();
  const [category, setCategory] = useState<CategorySlug | "all">(params.get("collection") || "all");
  const [sort, setSort] = useState<"featured" | "newest" | "price_asc" | "price_desc">("featured");
  const { data: categories } = useAsync(() => db.categories.list(), []);
  const { data: products } = useAsync(
    () =>
      db.products.list({
        category: category === "all" ? undefined : category,
        sort,
      }),
    [category, sort],
  );

  const count = products?.length ?? 0;
  const label = useMemo(
    () => (category === "all" ? "the house" : (categories ?? []).find((item) => item.slug === category)?.name),
    [category, categories],
  );

  const filters = (
    <section className={`mx-auto max-w-[1600px] ${embedded ? "" : "px-4 py-8 lg:px-10"}`}>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-ink">
          {count} looks in {label}
        </p>
        <div className="flex flex-wrap gap-3">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as CategorySlug | "all")}
            className="border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="all">All collections</option>
            {(categories ?? []).map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            className="border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price · low to high</option>
            <option value="price_desc">Price · high to low</option>
          </select>
        </div>
      </div>
      <ProductGrid products={products ?? []} />
    </section>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        <PageHeader title="Collections" subtitle="Browse the rail without leaving your book." />
        {filters}
      </div>
    );
  }

  return (
    <>
      <PageHero title="Shop" crumb="Shop" />
      {filters}
    </>
  );
}
