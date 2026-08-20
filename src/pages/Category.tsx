import { Link, Navigate, useParams } from "react-router-dom";
import PageHero from "@/components/PageHero";
import ProductGrid from "@/components/ProductGrid";
import { db, type CategorySlug } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { padCount } from "@/lib/whatsapp";

const alias: Record<string, CategorySlug> = {
  aranbada: "aranbada",
  senator: "senator",
  "men-senator": "senator",
  agbada: "agbada",
  esiki: "esiki",
  suit: "suit",
};

export default function CategoryPage({ forcedSlug }: { forcedSlug?: string }) {
  const params = useParams();
  const slug = forcedSlug ?? params.slug ?? "";
  const categorySlug = alias[slug] ?? slug;
  const { data: category, loading } = useAsync(() => (categorySlug ? db.categories.get(categorySlug) : Promise.resolve(null)), [
    categorySlug,
  ]);
  const { data: items } = useAsync(
    () => (categorySlug ? db.products.list({ category: categorySlug }) : Promise.resolve([])),
    [categorySlug],
  );
  const { data: categories } = useAsync(() => db.categories.list(), []);
  const { data: counts } = useAsync(() => db.categories.counts(), []);

  if (!categorySlug) {
    return <Navigate to="/collection" replace />;
  }
  if (!loading && !category) {
    return <Navigate to="/collection" replace />;
  }

  return (
    <>
      <PageHero
        title={category?.name ?? "Shop"}
        crumb={category?.name ?? "Shop"}
        trail={[{ label: "Collection", to: "/collection" }, { label: category?.name ?? "Shop" }]}
        image={category?.heroImage}
      />
      <section className="mx-auto max-w-[1600px] px-4 py-6 lg:px-10">
        <div className="flex flex-col-reverse gap-10 lg:flex-row">
          <div className="lg:w-56 shrink-0">
            <h2 className="mb-4 font-alt text-[19px] font-medium text-ink">Other Collections</h2>
            <ul className="space-y-3 text-[16px]">
              {(categories ?? []).map((entry) => (
                <li key={entry.slug} className="flex items-center justify-between">
                  <Link
                    to={entry.path}
                    className={`hover:text-ink ${entry.slug === categorySlug ? "font-medium text-ink" : ""}`}
                  >
                    {entry.name}
                  </Link>
                  <span className="text-sm text-muted">{padCount(counts?.[entry.slug] ?? 0)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 flex-1">
            <ProductGrid products={items ?? []} compact />
          </div>
        </div>
      </section>
    </>
  );
}
