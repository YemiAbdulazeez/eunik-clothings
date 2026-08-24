import { PageHeader, PageLoading } from "@/components/os/ui";
import ProfileForm from "@/components/os/ProfileForm";
import { useSession } from "@/context/SessionProvider";

export default function StudioProfile() {
  const { user, loading } = useSession();

  if (loading) return <PageLoading label="Opening your profile…" />;
  if (!user) return <PageLoading label="Opening your profile…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        subtitle="House file, contact details, and change password — temporary passwords stay valid until you update them."
      />
      <ProfileForm user={user} />
    </div>
  );
}
