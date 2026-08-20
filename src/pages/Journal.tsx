import { Link, useLocation } from "react-router-dom";
import PageHero from "@/components/PageHero";
import { PageHeader } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { inAccount, journalHref } from "@/lib/osNav";

export default function Journal() {
  const location = useLocation();
  const embedded = inAccount(location.pathname);
  const { data: posts } = useAsync(() => db.content.journal(), []);

  const grid = (
    <section className={`mx-auto grid max-w-6xl gap-10 ${embedded ? "" : "px-6 py-12"} md:grid-cols-2`}>
      {(posts ?? []).map((post) => (
        <Link key={post.id} to={journalHref(location.pathname, post.slug)} className="group">
          <img src={post.image} alt="" className="aspect-[4/5] w-full object-cover" />
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
