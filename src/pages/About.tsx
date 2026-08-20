import { useState } from "react";
import { Minus, Plus, Smile } from "lucide-react";
import PageHero from "../components/PageHero";

const values = [
  {
    letter: "E",
    title: "EXCELLENT",
    text: "Over the Years, We're known and remain committed to an extremely exceptional and satisfying standard of craftsmanship and outstanding services which can never be compromised.",
  },
  {
    letter: "U",
    title: "UNIQUE",
    text: "At EUNIK CLOTHINGS AND FASHION ACADEMY, we represent a unique symbol of exclusive Tailoring, personalized for each customer's specific needs and desires, ensuring their exclusivity and individuality.",
  },
  {
    letter: "N",
    title: "NEWNESS",
    text: "We cherish newness in our approach, appearances and services at any given opportunity to serve all clients. A brand that doesn't attract newness is a stagnant brand.",
  },
  {
    letter: "I",
    title: "INNOVATIVE",
    text: "We prioritize New/personal ideas and creativity to rule our fashion world, forecast and generate new trends as well as versatility to blend with new trends and vogues.",
  },
  {
    letter: "K",
    title: "KNOWLEDGEABLE",
    text: "It is good to be good at what we do, time to time knowledge upgrades to unlearn and relearn is crucial to all staff and students to get more exposed and explore different fields and businesses in fashion industry.",
  },
];

const gallery = [
  "/images/ara-bg.jpg",
  "/images/senator-bg.jpg",
  "/images/agbada-bg.jpg",
  "/images/agb2008.jpg",
  "/images/sen3012.jpg",
  "/images/esk4000.jpg",
];

export default function About() {
  const [open, setOpen] = useState<"mission" | "vision">("mission");

  return (
    <>
      <PageHero title="About" crumb="About" />

      <section className="px-4 lg:px-16">
        <div className="relative overflow-hidden">
          <img src="/images/ara-bg.jpg" alt="Eunik Clothings" className="max-h-[560px] w-full object-cover" />
          <div className="absolute left-[8%] top-1/2 h-28 w-28 -translate-y-1/2 sm:h-40 sm:w-40">
            <img src="/images/eunik.png" alt="" className="absolute inset-4 rounded-full bg-white object-contain p-2" />
            <span className="animate-spin-slow absolute inset-0 rounded-full border border-gold/60" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2">
        <div>
          <p className="mb-3 font-alt text-xl text-ink">
            <span className="highlight">How we started!</span>
          </p>
          <h2 className="font-alt text-4xl font-normal tracking-tight text-ink">
            The journey of <span className="font-semibold">Eunik Clothings.</span>
          </h2>
        </div>
        <div className="space-y-4">
          <p>
            The Brand formally called EuNikfits Clothings was Founded purely humbly since 2018 by
            Olasedidun Olamide when operated solely indoor and later got rebranded to EUNIK CLOTHINGS
            in 2021 when rapid growth and expansion metamorphosed. Since then EUNIK CLOTHINGS has
            rapidly established itself as one of the fastest growing and leading fashion brand /
            academy in Ibadan and Oyo state at large.
          </p>
          <p>
            In early 2021, we featured in our first ever Fashion showcasing our first ever collection
            (Our Heritage) at the URBAN STYLE FASHION SHOW. Ever since the beautiful experience, EUNIK
            CLOTHINGS has walked over 15 different Fashion shows and exhibitions within Oyo state and
            Inter State including Ekiti State, Lagos State and The Federal Capital Territory of The
            Federal Republic of Nigeria (ABUJA).
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden py-6">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gold" />
        <div className="flex gap-8 overflow-x-auto px-6">
          {gallery.map((src) => (
            <img key={src} src={src} alt="" className="h-56 w-72 shrink-0 object-cover md:h-72 md:w-80" />
          ))}
        </div>
      </section>

      <section className="bg-linear-to-b from-paper to-white px-6 py-20">
        <h2 className="mb-12 text-center font-alt text-4xl text-ink md:text-5xl">
          Our Core <span className="highlight font-semibold">Values</span>
        </h2>
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {values.map((value, index) => (
            <div key={value.letter} className={`relative ps-8 ${index % 2 === 1 ? "lg:mt-10" : ""}`}>
              <span className="absolute left-0 top-0 text-7xl font-extrabold text-ink/10">{value.letter}</span>
              <div className="pt-10">
                <h3 className="mb-2 text-[19px] font-semibold text-ink">{value.title}</h3>
                <p className="text-[15px] leading-7">{value.text}</p>
                <span className="mt-5 block h-0.5 w-14 bg-ink" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mx-auto mb-16 flex max-w-4xl items-center justify-center rounded-full border border-line bg-white px-6 py-5 text-center shadow-lg text-ink">
          <Smile className="mr-3 h-6 w-6 shrink-0" />
          <span className="text-xl font-medium">Clients across Oyo, Lagos, Abuja &amp; Ekiti.</span>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 font-alt text-xl text-ink">
              <span className="highlight">The company itself</span>
            </p>
            <h2 className="mb-5 font-alt text-4xl font-normal text-ink">
              <span className="font-semibold">EUNIK CLOTHINGS</span> is a subsidary of EUNIK
              MULTIPURPOSE COMPANY NIGERIA LIMITED (RC 1869194)
            </h2>
            <p>
              EUNIK Clothings is no doubt one of the fastest growing and award winning fashion brand
              situated in Ibadan, the capital city of Oyo State, Nigeria with years of excellent and
              competitive services ever since her inception in June 2018 solely started by the founder
              (Olasedidun Olamide A.) A creative tailor who has a burnout passion for Fashion.
              Confidently speaking on how our core values has really contributed to the success of the
              Brand and made us a choice for prominent and relevant personalities and fashion
              Enthusiasts.
            </p>
          </div>

          <div>
            {[
              {
                key: "mission" as const,
                title: "Our Mission",
                body: "A globally recognized Brand masterminding solving Fashion problems through unique crafts, creativity, education and timelessness impeccable heritage.",
              },
              {
                key: "vision" as const,
                title: "Our Vision",
                body: "To be the leading African fashion house where craftsmanship, education, and timeless design meet — dressing clients and training the next generation of tailors across the continent.",
              },
            ].map((item) => {
              const isOpen = open === item.key;
              return (
                <div key={item.key} className="border-b border-line">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 py-4 text-left text-[19px] font-semibold text-ink"
                    onClick={() => setOpen(item.key)}
                  >
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {item.title}
                  </button>
                  {isOpen ? <p className="pb-5">{item.body}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
