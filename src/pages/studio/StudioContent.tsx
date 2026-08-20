import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import ImageUpload from "@/components/os/ImageUpload";
import { Field, OsButton, PageHeader, SectionCard, inputClass } from "@/components/os/ui";
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
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
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
  }

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
          {home.hero.map((slide, index) => (
            <div key={slide.title} className="grid gap-3 rounded-xl border border-line p-3 md:grid-cols-2">
              <input name={`heroTitle${index}`} defaultValue={slide.title} className={inputClass} placeholder="Title" />
              <input name={`heroSubtitle${index}`} defaultValue={slide.subtitle} className={inputClass} placeholder="Subtitle" />
              <ImageUpload name={`heroImage${index}`} label="Slide image" value={slide.image} />
              <input name={`heroTo${index}`} defaultValue={slide.to} className={inputClass} placeholder="/path" />
            </div>
          ))}
        </div>
      </SectionCard>
      <OsButton type="submit">Save homepage</OsButton>
    </form>
  );
}

function JournalManager({ posts }: { posts: Awaited<ReturnType<typeof db.content.journal>> }) {
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title"));
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
          <ImageUpload name="image" label="Cover image" value="/images/sen3007.jpg" />
          <input name="excerpt" placeholder="Excerpt" className={inputClass} />
          <textarea name="content" rows={4} placeholder="Body" className={inputClass} />
          <OsButton type="submit">Publish</OsButton>
        </form>
      </SectionCard>
    </div>
  );
}

function LookbookManager({ items }: { items: Awaited<ReturnType<typeof db.content.lookbook>> }) {
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await db.content.saveLookbook({
      title: String(data.get("title")),
      image: String(data.get("image")),
      collection: String(data.get("collection")),
      productId: String(data.get("productId") || "") || undefined,
      notes: String(data.get("notes")),
    });
    toast.success("Lookbook tile saved.");
    event.currentTarget.reset();
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
          <ImageUpload name="image" label="Tile image" value="/images/ara5003.jpg" />
          <select name="collection" className={inputClass}>
            <option value="aranbada">Ara'nbada</option>
            <option value="senator">Senator</option>
            <option value="agbada">Agbada</option>
            <option value="esiki">Esiki</option>
            <option value="suit">Suit</option>
          </select>
          <input name="productId" placeholder="product id e.g. ara5003" className={inputClass} />
          <input name="notes" placeholder="Notes" className={inputClass} />
          <OsButton type="submit">Save tile</OsButton>
        </form>
      </SectionCard>
    </div>
  );
}

function ContactForm({ mail }: { mail: { id: string; to: string; subject: string; sentAt: string }[] }) {
  const { data: settings } = useAsync(() => db.settings.get(), []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await db.settings.update({
      phone: String(data.get("phone")),
      email: String(data.get("email")),
      whatsapp: String(data.get("whatsapp")),
      instagram: String(data.get("instagram")),
      address: String(data.get("address")),
      pickupLocation: String(data.get("pickupLocation")),
      aboutJoinLine: String(data.get("aboutJoinLine")),
      bank: {
        bankName: String(data.get("bankName")),
        accountName: String(data.get("accountName")),
        accountNumber: String(data.get("accountNumber")),
        narrationHint: String(data.get("narrationHint")),
      },
    });
    toast.success("Contact details published to the house.");
  }
  if (!settings) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={(event) => void save(event)} className="space-y-4">
        <SectionCard title="Public contact">
          <Field label="Phone">
            <input name="phone" defaultValue={settings.phone} className={inputClass} />
          </Field>
          <Field label="Email">
            <input name="email" defaultValue={settings.email} className={inputClass} />
          </Field>
          <Field label="WhatsApp">
            <input name="whatsapp" defaultValue={settings.whatsapp} className={inputClass} />
          </Field>
          <Field label="Instagram URL">
            <input name="instagram" defaultValue={settings.instagram} className={inputClass} />
          </Field>
          <Field label="Address">
            <input name="address" defaultValue={settings.address} className={inputClass} />
          </Field>
          <Field label="Pickup line">
            <input name="pickupLocation" defaultValue={settings.pickupLocation} className={inputClass} />
          </Field>
          <Field label="About trust line">
            <input name="aboutJoinLine" defaultValue={settings.aboutJoinLine} className={inputClass} />
          </Field>
        </SectionCard>
        <SectionCard title="House bank (checkout)">
          <Field label="Bank">
            <input name="bankName" defaultValue={settings.bank.bankName} className={inputClass} />
          </Field>
          <Field label="Account name">
            <input name="accountName" defaultValue={settings.bank.accountName} className={inputClass} />
          </Field>
          <Field label="Account number">
            <input name="accountNumber" defaultValue={settings.bank.accountNumber} className={inputClass} />
          </Field>
          <Field label="Narration">
            <input name="narrationHint" defaultValue={settings.bank.narrationHint} className={inputClass} />
          </Field>
          <OsButton type="submit" className="mt-3">
            Save contact
          </OsButton>
        </SectionCard>
      </form>
      <SectionCard title="Outbound house mail (demo)">
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
