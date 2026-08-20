import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallPrompt() {
  const [event, setEvent] = useState<PromptEvent | null>(null);
  const [hidden, setHidden] = useState(() => localStorage.getItem("eunik-install-dismiss") === "1");

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      setEvent(e as PromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || !event) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-sm rounded-2xl border border-line bg-white p-4 text-sm lg:bottom-4">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
        <div>
          <p className="font-medium text-ink">Install the EUNIK app</p>
          <p className="mt-1">Add the house to your home screen — shop, track and fittings without the browser chrome.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="os-pill bg-ink text-white"
              onClick={() => void event.prompt()}
            >
              Install
            </button>
            <button
              type="button"
              className="os-pill border border-line"
              onClick={() => {
                localStorage.setItem("eunik-install-dismiss", "1");
                setHidden(true);
              }}
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            localStorage.setItem("eunik-install-dismiss", "1");
            setHidden(true);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
