import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { landingPath } from "@/db/session";

export default function DemoRoleSwitcher() {
  const { user, session, refresh } = useSession();
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const navigate = useNavigate();

  if (!settings?.demoMode || !import.meta.env.DEV || Boolean(import.meta.env.VITE_API_URL)) return null;
  const show = Boolean(user && user.role !== "client");
  if (!show) return null;

  async function act(userId: string) {
    try {
      await db.auth.switchDemoUser(userId);
      await refresh();
      const me = await db.auth.me();
      toast.message("Now walking as another door of the house.");
      if (me) navigate(landingPath(me));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot walk that door.");
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-full border border-ink bg-gold px-3 py-2 text-xs text-ink">
      <span className="mr-2 font-semibold">Demo</span>
      <button type="button" className="underline" onClick={() => void act("user_tailor")}>
        Tailor
      </button>
      <span className="mx-1">·</span>
      <button
        type="button"
        className="underline"
        onClick={() => void act(session?.actingFromId ?? "user_olamide")}
      >
        Admin
      </button>
    </div>
  );
}
