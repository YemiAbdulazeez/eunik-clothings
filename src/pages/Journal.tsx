import { Link, useLocation } from "react-router-dom";
import LazyImage from "@/components/LazyImage";
import PageHero from "@/components/PageHero";
import { PageSkeleton, CardSkeleton } from "@/components/Skeleton";
import { PageHeader } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { inAccount, journalHref } from "@/lib/osNav";

export default function Journal() {
  const location = useLocation();
  const embedded = inAccount(location.pathname);
  const { data: posts, loading } = useAsync(() => db.content.journal(), []);

  if (loading) {
    return embedded ? (
      <PageSkeleton />
    ) : (
      <>
        <PageHero title="Magazine" crumb="Journal" />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <CardSkeleton count={4} />
        </div>
      </>
    );
  }

  const grid = (
    <section className={`mx-auto grid max-w-6xl gap-10 ${embedded ? "" : "px-6 py-12"} md:grid-cols-2`}>
      {(posts ?? []).map((post) => (
        <Link key={post.id} to={journalHref(location.pathname, post.slug)} className="group">
          <LazyImage src={post.image} alt="" className="aspect-[4/5] w-full object-cover" aspectClassName="aspect-[4/5] w-full" />
          <p className="mt-3 text-sm">{post.date}</p>
          <h2 className="font-alt text-2xl text-ink group-hover:underline">{post.title}</h2>
          <p>{post.excerpt}</p>
        </Link>
      ))}
    </section>
  );

  if (embedded) {
    return (
      <div className="space-y-6">
        <PageHeader title="Magazine" subtitle="House stories stay inside your book." />
        {grid}
      </div>
    );
  }

  return (
    <>
      <PageHero title="Magazine" crumb="Journal" />
      {grid}
    </>
  );
}
