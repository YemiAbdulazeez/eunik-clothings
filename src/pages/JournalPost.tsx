import { Link, useLocation, useParams } from "react-router-dom";
import PageHero from "@/components/PageHero";
import { PageHeader } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { inAccount, journalHref } from "@/lib/osNav";

export default function JournalPost() {
  const { slug = "" } = useParams();
  const location = useLocation();
  const embedded = inAccount(location.pathname);
  const { data: post } = useAsync(() => db.content.journalBySlug(slug), [slug]);

  const article = (
    <article className={`mx-auto max-w-3xl ${embedded ? "" : "px-6 py-12"}`}>
      {post ? (
        <>
          <img src={post.image} alt="" className="mb-8 w-full object-cover" />
          <p className="text-sm">
            {post.author} · {post.date}
          </p>
          <p className="mt-6 text-lg leading-8">{post.content}</p>
          <Link to={journalHref(location.pathname)} className="mt-8 inline-block text-ink underline">
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
