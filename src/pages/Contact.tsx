import { type FormEvent, useState } from "react";
import {
  BookOpen,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Smile,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import PageHero from "../components/PageHero";
import { db } from "@/db/database";
import { HTTP_ENABLED } from "@/api/http";
import { useAsync } from "@/hooks/useAsync";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const email = settings?.email ?? "info@eunikclothings.com";
  const phone = settings?.phone ?? "08167073585";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const phone = String(data.get("phone") ?? "");
    const subject = String(data.get("subject") ?? "Eunik enquiry");
    const message = String(data.get("comment") ?? "");

    try {
      await db.tickets.create({ name, email, phone, subject, message });
      setSent(true);
      toast.success("Received at the house.");
      form.reset();
    } catch (error) {
      if (HTTP_ENABLED) {
        toast.error(error instanceof Error ? error.message : "Could not send your message.");
        return;
      }
      const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
      )}`;
      window.location.href = mailto;
    }
  }

  return (
    <>
      <PageHero title="Contact Us" crumb="Contact Us" />

      <section className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-8 lg:grid-cols-2">
        <div>
          <p className="mb-3 font-alt text-xl text-ink">
            <span className="highlight">Feel free to get in touch!</span>
          </p>
          <h2 className="mb-6 font-alt text-4xl font-normal text-ink">
            Call or visit us at this <span className="font-semibold">location.</span>
          </h2>
          <p className="mb-4 text-[22px] font-bold text-ink">Ibadan</p>
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-lg font-semibold text-ink">Eunik - Headquarters</p>
              <p>
                {settings?.address ?? "Ibadan"}
                <br />
                Nigeria
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold text-ink">Get in touch</p>
              <a href={`tel:${phone}`} className="block hover:text-ink">
                {phone}
              </a>
              <a href={`mailto:${email}`} className="underline decoration-ink/30 underline-offset-4 text-ink">
                {email}
              </a>
            </div>
          </div>
        </div>
        <div className="relative">
          <img src="/images/map.png" alt="Eunik location map" className="w-full" />
          <span className="absolute top-20 left-16 flex h-10 w-10 items-center justify-center rounded-full bg-gold text-white">
            <MapPin className="h-4 w-4 text-ink" />
          </span>
        </div>
      </section>

      <section
        className="h-[400px] bg-cover bg-center sm:h-[500px] lg:h-[600px]"
        style={{ backgroundImage: "url('/images/map.png')" }}
      />

      <section className="relative z-10 mx-auto -mt-40 max-w-5xl px-6 pb-20">
        <div className="rounded-md bg-white px-6 py-10 shadow-2xl sm:px-12">
          <div className="mb-8 flex items-start justify-between">
            <h2 className="font-alt text-4xl text-ink">
              How we can <span className="highlight font-semibold">help</span> you?
            </h2>
            <Send className="h-8 w-8 text-ink" />
          </div>
          <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
            <label className="block">
              <span className="font-semibold text-ink">Enter your name*</span>
              <span className="mt-2 flex items-center gap-3 border-b border-line">
                <Smile className="h-4 w-4" />
                <input
                  name="name"
                  required
                  placeholder="What's your full name?"
                  className="w-full bg-transparent py-2 outline-none"
                />
              </span>
            </label>
            <label className="block">
              <span className="font-semibold text-ink">Email address*</span>
              <span className="mt-2 flex items-center gap-3 border-b border-line">
                <Mail className="h-4 w-4" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full bg-transparent py-2 outline-none"
                />
              </span>
            </label>
            <label className="block">
              <span className="font-semibold text-ink">Phone number*</span>
              <span className="mt-2 flex items-center gap-3 border-b border-line">
                <Phone className="h-4 w-4" />
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="Enter your phone number"
                  className="w-full bg-transparent py-2 outline-none"
                />
              </span>
            </label>
            <label className="block">
              <span className="font-semibold text-ink">Subject</span>
              <span className="mt-2 flex items-center gap-3 border-b border-line">
                <BookOpen className="h-4 w-4" />
                <input
                  name="subject"
                  placeholder="How can we help you?"
                  className="w-full bg-transparent py-2 outline-none"
                />
              </span>
            </label>
            <label className="sm:col-span-2 block">
              <span className="font-semibold text-ink">Your message</span>
              <span className="mt-2 flex items-start gap-3 border-b border-line">
                <MessageSquare className="mt-3 h-4 w-4" />
                <textarea
                  name="comment"
                  rows={4}
                  placeholder="Tell us about your project or fitting need"
                  className="w-full bg-transparent py-2 outline-none"
                />
              </span>
            </label>
            <p className="text-sm leading-6">
              We are committed to protecting your privacy. We will never collect information about you
              without your explicit consent.
            </p>
            <div className="text-right">
              <button type="submit" className="rounded-full bg-ink px-6 py-2.5 text-sm text-white shadow-lg">
                Send message
              </button>
            </div>
            {sent ? (
              <p className="sm:col-span-2 text-ink">Received at the house. We’ll reply from Ibadan.</p>
            ) : null}
          </form>
        </div>
      </section>
    </>
  );
}
