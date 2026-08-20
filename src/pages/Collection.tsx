import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { padCount } from "@/lib/whatsapp";

export default function Collection() {
  const { data: categories } = useAsync(() => db.categories.list(), []);
  const { data: counts } = useAsync(() => db.categories.counts(), []);

  return (
    <>
      <PageHero title="Collections" crumb="Collection" trail={[{ label: "Collection" }]} />
      <section className="mx-auto max-w-6xl px-6 py-8 pb-20">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {(categories ?? []).map((category) => (
            <div key={category.slug} className="collection-card relative overflow-hidden">
              <Link to={category.path}>
                <img
                  src={category.heroImage ?? category.image}
                  alt={category.name}
                  className="aspect-[3/4] w-full object-cover transition duration-700"
                />
              </Link>
              <span className="absolute right-5 top-5 rounded-full border border-black/15 px-3 py-0.5 text-[11px] font-medium uppercase text-ink">
                {padCount(counts?.[category.slug] ?? 0)} items
              </span>
              <Link
                to={category.path}
                className="absolute bottom-10 left-1/2 min-w-[150px] -translate-x-1/2 rounded-full bg-white px-8 py-3 text-center text-lg font-alt shadow-lg"
              >
                {category.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
