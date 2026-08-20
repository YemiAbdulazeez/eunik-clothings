import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";

export default function Lookbook() {
  const { data: items } = useAsync(() => db.content.lookbook(), []);

  return (
    <>
      <PageHero title="Lookbook" crumb="Lookbook" />
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {(items ?? []).map((item) => (
          <article key={item.id}>
            <img src={item.image} alt={item.title} className="aspect-[3/4] w-full object-cover" />
            <p className="mt-3 font-alt text-xl text-ink">{item.title}</p>
            <p className="text-sm">{item.notes}</p>
            {item.productId ? (
              <Link to={`/shop/${item.productId.toUpperCase()}`} className="text-sm text-ink underline">
                View look
              </Link>
            ) : null}
          </article>
        ))}
      </section>
    </>
  );
}
