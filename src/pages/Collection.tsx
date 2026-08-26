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
        <div className="grid grid-cols-2 gap-3 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
          {(categories ?? []).map((category) => (
            <div key={category.slug} className="collection-card relative overflow-hidden">
              <Link to={category.path}>
                <img
                  src={category.heroImage ?? category.image}
                  alt={category.name}
                  className="aspect-[3/4] w-full object-cover transition duration-700"
                />
              </Link>
              <span className="absolute right-2 top-2 rounded-full border border-black/15 px-2 py-0.5 text-[9px] font-medium uppercase text-ink sm:right-5 sm:top-5 sm:px-3 sm:text-[11px]">
                {padCount(counts?.[category.slug] ?? 0)} items
              </span>
              <Link
                to={category.path}
                className="absolute bottom-4 left-1/2 min-w-0 max-w-[90%] -translate-x-1/2 rounded-full bg-white px-3 py-2 text-center text-sm font-alt shadow-lg sm:bottom-10 sm:min-w-[150px] sm:px-8 sm:py-3 sm:text-lg"
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
