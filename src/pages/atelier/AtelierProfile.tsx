import { PageHeader, PageLoading } from "@/components/os/ui";
import ProfileForm from "@/components/os/ProfileForm";
import { useSession } from "@/context/SessionProvider";

/** Floor profile — same file as studio, with atelier-facing copy. */
export default function AtelierProfile() {
  const { user, loading, refresh } = useSession();

  if (loading) return <PageLoading label="Opening your profile…" />;
  if (!user) return <PageLoading label="Opening your profile…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        subtitle="Staff file and change password. You can keep a temporary password or set a private one when ready."
        onRefresh={() => refresh()}
      />
      <ProfileForm user={user} />
    </div>
  );
}
