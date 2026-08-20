import { Link, useParams } from "react-router-dom";
import PageHero from "@/components/PageHero";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";

export default function EventDetail() {
  const { slug = "" } = useParams();
  const { data: event } = useAsync(() => db.content.eventBySlug(slug), [slug]);

  return (
    <>
      <PageHero title={event?.name ?? "Event"} crumb={event?.name ?? "Events"} trail={[{ label: "Events", to: "/events" }, { label: event?.name ?? "Event" }]} />
      <section className="mx-auto max-w-3xl px-6 py-12">
        {event ? (
          <>
            <img src={event.image} alt="" className="mb-6 w-full object-cover" />
            <p className="text-ink">
              {event.date} · {event.location}
            </p>
            <p className="mt-4 leading-8">{event.description}</p>
            <Link to={`/book?event=${slug}`} className="mt-8 inline-block bg-ink px-6 py-3 text-white">
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
