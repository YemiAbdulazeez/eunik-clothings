import { Check, Copy, Facebook, Link2, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

export default function ShareBar({
  title,
  url,
  text,
}: {
  title: string;
  url?: string;
  text?: string;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => url ?? (typeof window !== "undefined" ? window.location.href : ""), [url]);
  const blurb = text ?? title;

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: blurb, url: shareUrl });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  }

  const encoded = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(blurb);

  const btn =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-ink hover:bg-paper";

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share">
      <span className="os-label mr-1">Share</span>
      <button type="button" className={btn} aria-label="Share" onClick={() => void nativeShare()}>
        <Share2 className="h-4 w-4" />
      </button>
      <a
        className={btn}
        aria-label="Share on WhatsApp"
        href={`https://wa.me/?text=${encodeURIComponent(`${blurb} ${shareUrl}`)}`}
        target="_blank"
        rel="noreferrer"
      >
        <span className="text-xs font-bold text-green-700">WA</span>
      </a>
      <a
        className={btn}
        aria-label="Share on X"
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedText}`}
        target="_blank"
        rel="noreferrer"
      >
        <TwitterIcon className="h-4 w-4" />
      </a>
      <a
        className={btn}
        aria-label="Share on Facebook"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noreferrer"
      >
        <Facebook className="h-4 w-4" />
      </a>
      <button type="button" className={btn} aria-label="Copy link" onClick={() => void copyLink()}>
        {copied ? <Check className="h-4 w-4 text-green-700" /> : <Copy className="h-4 w-4" />}
      </button>
      <a className={`${btn} sm:hidden`} aria-label="Open link" href={shareUrl}>
        <Link2 className="h-4 w-4" />
      </a>
    </div>
  );
}
