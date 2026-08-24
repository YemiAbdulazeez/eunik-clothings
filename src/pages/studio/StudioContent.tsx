import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import ImageUpload from "@/components/os/ImageUpload";
import { Field, OsButton, PageHeader, SectionCard, inputClass } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { slugify } from "@/lib/format";

const TABS = ["Homepage", "Magazine", "Lookbook", "Contact"] as const;

export default function StudioContent() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Homepage");
  const { data: home } = useAsync(() => db.content.homepage(), []);
  const { data: journal } = useAsync(() => db.content.journal(), []);
  const { data: lookbook } = useAsync(() => db.content.lookbook(), []);
  const { data: mailbox } = useAsync(() => db.content.mailbox().catch(() => []), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        subtitle="Magazine, lookbook and the house front. Products and collections live as standalone tools."
      />
      <div className="flex flex-wrap gap-1 rounded-full border border-line bg-white p-1">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === item ? "bg-ink text-white" : "text-ink"}`}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "Homepage" && home ? <HomeForm home={home} /> : null}
      {tab === "Magazine" ? <JournalManager posts={journal ?? []} /> : null}
      {tab === "Lookbook" ? <LookbookManager items={lookbook ?? []} /> : null}
      {tab === "Contact" ? <ContactForm mail={mailbox ?? []} /> : null}
    </div>
  );
}

function HomeForm({ home }: { home: Awaited<ReturnType<typeof db.content.homepage>> }) {
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await db.content.updateHomepage({
        magazineTitle: String(data.get("magazineTitle") ?? ""),
        newArrivalTitle: String(data.get("newArrivalTitle") ?? ""),
        newArrivalEyebrow: String(data.get("newArrivalEyebrow") ?? ""),
        aboutTrustLine: String(data.get("aboutTrustLine") ?? ""),
        promoCode: String(data.get("promoCode") ?? ""),
        showMagazine: data.get("showMagazine") === "on",
        showPromo: data.get("showPromo") === "on",
        showArrivals: data.get("showArrivals") === "on",
        hero: [0, 1, 2].map((index) => ({
          title: String(data.get(`heroTitle${index}`) ?? ""),
          subtitle: String(data.get(`heroSubtitle${index}`) ?? ""),
          image: String(data.get(`heroImage${index}`) ?? ""),
          to: String(data.get(`heroTo${index}`) ?? ""),
        })),
      });
      toast.success("Homepage saved. Open Home to see it.");
    } finally {
      setBusy(false);
    }
  }

  const heroSlides = [0, 1, 2].map((index) => home.hero[index] ?? { title: "", subtitle: "", image: "", to: "" });

  return (
    <form onSubmit={(event) => void save(event)} className="space-y-6">
      <SectionCard title="Sections">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Magazine title">
            <input name="magazineTitle" defaultValue={home.magazineTitle} className={inputClass} />
          </Field>
          <Field label="Promo code shown">
            <input name="promoCode" defaultValue={home.promoCode} className={inputClass} />
          </Field>
          <Field label="Arrivals eyebrow">
            <input name="newArrivalEyebrow" defaultValue={home.newArrivalEyebrow} className={inputClass} />
          </Field>
          <Field label="Arrivals title">
            <input name="newArrivalTitle" defaultValue={home.newArrivalTitle} className={inputClass} />
          </Field>
          <Field label="About trust line">
            <input name="aboutTrustLine" defaultValue={home.aboutTrustLine} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="showMagazine" defaultChecked={home.showMagazine} /> Magazine
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="showPromo" defaultChecked={home.showPromo} /> Promo strip
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="showArrivals" defaultChecked={home.showArrivals} /> Arrivals
          </label>
        </div>
      </SectionCard>
      <SectionCard title="Hero slides">
        <div className="grid gap-4">
          {heroSlides.map((slide, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-line p-3 md:grid-cols-2">
              <input name={`heroTitle${index}`} defaultValue={slide.title} className={inputClass} placeholder="Title" />
              <input name={`heroSubtitle${index}`} defaultValue={slide.subtitle} className={inputClass} placeholder="Subtitle" />
              <ImageUpload name={`heroImage${index}`} label="Slide image" value={slide.image} folder="looks" />
              <input name={`heroTo${index}`} defaultValue={slide.to} className={inputClass} placeholder="/path" />
            </div>
          ))}
        </div>
      </SectionCard>
      <OsButton type="submit" loading={busy} loadingText="Saving…">
        Save homepage
      </OsButton>
    </form>
  );
}

function JournalManager({ posts }: { posts: Awaited<ReturnType<typeof db.content.journal>> }) {
  const [busy, setBusy] = useState(false);
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title"));
    setBusy(true);
    try {
      await db.content.saveJournal({
        slug: slugify(title),
        title,
        excerpt: String(data.get("excerpt")),
        image: String(data.get("image")),
        author: "Olamide Olasedidun",
        date: new Date().toISOString().slice(0, 10),
        content: String(data.get("content")),
      });
      toast.success("Story published.");
      event.currentTarget.reset();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Magazine stories">
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center justify-between gap-3">
              <span className="text-ink">{post.title}</span>
              <button type="button" className="text-sm underline" onClick={() => void db.content.removeJournal(post.id).then(() => toast.message("Removed."))}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Add story">
        <form onSubmit={(event) => void add(event)} className="space-y-3">
          <input name="title" required placeholder="Title" className={inputClass} />
          <ImageUpload name="image" label="Cover image" value="/images/sen3007.jpg" folder="looks" />
          <input name="excerpt" placeholder="Excerpt" className={inputClass} />
          <textarea name="content" rows={4} placeholder="Body" className={inputClass} />
          <OsButton type="submit" loading={busy} loadingText="Publishing…">
            Publish
          </OsButton>
        </form>
      </SectionCard>
    </div>
  );
}

function LookbookManager({ items }: { items: Awaited<ReturnType<typeof db.content.lookbook>> }) {
  const [busy, setBusy] = useState(false);
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await db.content.saveLookbook({
        title: String(data.get("title")),
        image: String(data.get("image")),
        collection: String(data.get("collection")),
        productId: String(data.get("productId") || "") || undefined,
        notes: String(data.get("notes")),
      });
      toast.success("Lookbook tile saved.");
      event.currentTarget.reset();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Tiles">
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id}>
              <img src={item.image} alt="" className="h-32 w-full rounded-xl object-cover" />
              <p className="mt-1 text-sm text-ink">{item.title}</p>
              <button type="button" className="text-xs underline" onClick={() => void db.content.removeLookbook(item.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Add tile">
        <form onSubmit={(event) => void add(event)} className="space-y-3">
          <input name="title" required placeholder="Title" className={inputClass} />
          <ImageUpload name="image" label="Tile image" value="/images/ara5003.jpg" folder="looks" />
          <select name="collection" className={inputClass}>
            <option value="aranbada">Ara'nbada</option>
            <option value="senator">Senator</option>
            <option value="agbada">Agbada</option>
            <option value="esiki">Esiki</option>
            <option value="suit">Suit</option>
          </select>
          <input name="productId" placeholder="product id e.g. ara5003" className={inputClass} />
          <input name="notes" placeholder="Notes" className={inputClass} />
          <OsButton type="submit" loading={busy} loadingText="Saving…">
            Save tile
          </OsButton>
        </form>
      </SectionCard>
    </div>
  );
}

function ContactForm({ mail }: { mail: { id: string; to: string; subject: string; sentAt: string }[] }) {
  const { user } = useSession();
  const { data: settings } = useAsync(() => db.settings.get(), []);
  if (!settings) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Public contact (read from Settings)">
        <p className="text-sm text-ink">{settings.company}</p>
        <p className="mt-2 text-sm">{settings.phone}</p>
        <p className="text-sm">{settings.email}</p>
        <p className="text-sm">{settings.address}</p>
        <p className="mt-4 text-sm text-muted">
          {user?.role === "super_admin"
            ? "Edit company, bank, and deposit rules in Studio → Settings."
            : "Only the house principal can change these in Settings."}
        </p>
        {user?.role === "super_admin" ? (
          <a href="/studio/settings" className="os-pill mt-4 inline-flex bg-ink text-white">
            Open Settings
          </a>
        ) : null}
      </SectionCard>
      <SectionCard title="Outbound house mail">
        {mail.length === 0 ? <p className="text-sm">No checkout welcome letters yet.</p> : null}
        <ul className="space-y-3 text-sm">
          {mail.map((item) => (
            <li key={item.id} className="rounded-xl border border-line p-3">
              <p className="text-ink">{item.subject}</p>
              <p>
                To {item.to} · {item.sentAt.slice(0, 16)}
              </p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
