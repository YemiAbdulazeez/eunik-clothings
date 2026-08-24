import { PageHeader, PageLoading } from "@/components/os/ui";
import ProfileForm from "@/components/os/ProfileForm";
import { useSession } from "@/context/SessionProvider";

export default function AccountProfile() {
  const { user, loading } = useSession();

  if (loading) return <PageLoading label="Opening your profile…" />;
  if (!user) return <PageLoading label="Opening your profile…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        subtitle="Name, contact details, and a password that is only yours. Temporary passwords stay valid until you change them."
      />
      <ProfileForm user={user} />
    </div>
  );
}
