import { Link, useParams } from "react-router-dom";
import LazyImage from "@/components/LazyImage";
import PageHero from "@/components/PageHero";
import ShareBar from "@/components/ShareBar";
import { PageSkeleton } from "@/components/Skeleton";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";

export default function EventDetail() {
  const { slug = "" } = useParams();
  const { data: event, loading } = useAsync(() => db.content.eventBySlug(slug), [slug]);

  if (loading) {
    return (
      <>
        <PageHero title="Event" crumb="Events" />
        <PageSkeleton />
      </>
    );
  }

  return (
    <>
      <PageHero
        title={event?.name ?? "Event"}
        crumb={event?.name ?? "Events"}
        trail={[
          { label: "Events", to: "/events" },
          { label: event?.name ?? "Event" },
        ]}
      />
      <section className="mx-auto max-w-3xl px-6 py-12">
        {event ? (
          <>
            <LazyImage
              src={event.image}
              alt=""
              className="aspect-[16/10] w-full object-cover"
              aspectClassName="mb-6 aspect-[16/10] w-full"
            />
            <ShareBar title={event.name} text={`${event.name} · ${event.date} · ${event.location}`} />
            <p className="mt-4 text-ink">
              {event.date} · {event.location}
            </p>
            <p className="mt-4 leading-8">{event.description}</p>
            <Link
              to={`/book?event=${slug}`}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm text-white transition-colors hover:bg-ink/90"
            >
              Book for this event
            </Link>
          </>
        ) : (
          <p>That event is not listed.</p>
        )}
      </section>
    </>
  );
}
