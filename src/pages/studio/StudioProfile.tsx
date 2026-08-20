import { PageHeader } from "@/components/os/ui";
import ProfileForm from "@/components/os/ProfileForm";
import { useSession } from "@/context/SessionProvider";

export default function StudioProfile() {
  const { user } = useSession();
  if (!user) return null;
  return (
    <div className="space-y-6">
      <PageHeader title="Staff profile" subtitle="House file — department, emergency contact, birthday." />
      <ProfileForm user={user} />
    </div>
  );
}
