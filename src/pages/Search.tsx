import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHero from "@/components/PageHero";
import { db } from "@/db/database";
import { formatNaira } from "@/lib/money";
import { trackEvent } from "@/lib/track";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [hits, setHits] = useState<Awaited<ReturnType<typeof db.search.all>> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromUrl = params.get("q") ?? "";
    setQ(fromUrl);
  }, [params]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = q.trim();
      if (trimmed !== (params.get("q") ?? "")) {
        setParams(trimmed ? { q: trimmed } : {}, { replace: true });
      }
      if (!trimmed) {
        setHits(null);
        return;
      }
      setLoading(true);
      void db.search
        .all(trimmed)
        .then((result) => {
          setHits(result);
          trackEvent("search", { path: `/search?q=${encodeURIComponent(trimmed)}` });
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q, params, setParams]);

  return (
    <>
      <PageHero title="Search" crumb="Search" />
      <section className="mx-auto max-w-3xl px-6 py-10">
        <input
          autoFocus
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="SKU, look, or magazine line"
          className="w-full border-b border-ink py-3 text-xl text-ink outline-none"
        />
        {loading ? <p className="mt-6 text-sm text-muted">Searching…</p> : null}
        {hits ? (
          <div className="mt-10 space-y-8">
            <div>
              <p className="os-label mb-3">Looks</p>
              <ul className="space-y-2">
                {hits.products.map((product) => (
                  <li key={product.id}>
                    <Link to={`/shop/${product.sku}`} className="flex justify-between text-ink hover:underline">
                      <span>
                        {product.name} · {product.sku}
                      </span>
                      <span>{formatNaira(product.priceKobo)}</span>
                    </Link>
                  </li>
                ))}
                {hits.products.length === 0 ? <li>No garments match.</li> : null}
              </ul>
            </div>
            <div>
              <p className="os-label mb-3">Magazine</p>
              <ul className="space-y-2">
                {hits.posts.map((post) => (
                  <li key={post.id}>
                    <Link to={`/journal/${post.slug}`} className="text-ink hover:underline">
                      {post.title}
                    </Link>
                  </li>
                ))}
                {hits.posts.length === 0 ? <li>No stories match.</li> : null}
              </ul>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
