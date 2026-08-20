import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";

export default function Events() {
  const { data: events } = useAsync(() => db.content.events(), []);

  return (
    <>
      <PageHero title="Events" crumb="Events" />
      <section className="mx-auto max-w-4xl space-y-8 px-6 py-12">
        {(events ?? []).map((event) => (
          <Link key={event.id} to={`/events/${event.slug}`} className="grid gap-6 border-b border-line pb-8 md:grid-cols-[240px_1fr]">
            <img src={event.image} alt="" className="h-48 w-full object-cover" />
            <div>
              <p className="text-sm">{event.date} · {event.location}</p>
              <h2 className="font-alt text-3xl text-ink">{event.name}</h2>
              <p className="mt-2">{event.description}</p>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
