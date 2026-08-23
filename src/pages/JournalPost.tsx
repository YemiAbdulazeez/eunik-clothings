import { Link, useLocation, useParams } from "react-router-dom";
import LazyImage from "@/components/LazyImage";
import PageHero from "@/components/PageHero";
import ShareBar from "@/components/ShareBar";
import { PageHeader } from "@/components/os/ui";
import { PageSkeleton } from "@/components/Skeleton";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { inAccount, journalHref } from "@/lib/osNav";

export default function JournalPost() {
  const { slug = "" } = useParams();
  const location = useLocation();
  const embedded = inAccount(location.pathname);
  const { data: post, loading } = useAsync(() => db.content.journalBySlug(slug), [slug]);

  if (loading) {
    return embedded ? <PageSkeleton /> : (
      <>
        <PageHero title="Magazine" crumb="Journal" />
        <PageSkeleton />
      </>
    );
  }

  const article = (
    <article className={`mx-auto max-w-3xl ${embedded ? "" : "px-6 py-12"}`}>
      {post ? (
        <>
          <LazyImage src={post.image} alt="" className="mb-8 aspect-[16/10] w-full object-cover" aspectClassName="mb-8 aspect-[16/10] w-full" />
          <ShareBar title={post.title} text={post.excerpt || post.title} />
          <p className="mt-4 text-sm">
            {post.author} · {post.date}
          </p>
          <p className="mt-6 text-lg leading-8">{post.content}</p>
          <Link to={journalHref(location.pathname)} className="mt-8 inline-block text-ink underline hover:opacity-70">
            All stories
          </Link>
        </>
      ) : (
        <p>That story is not in the house file.</p>
      )}
    </article>
  );

  if (embedded) {
    return (
      <div className="space-y-6">
        <PageHeader title={post?.title ?? "Magazine"} />
        {article}
      </div>
    );
  }

  return (
    <>
      <PageHero title={post?.title ?? "Magazine"} crumb="Journal" />
      {article}
    </>
  );
}
