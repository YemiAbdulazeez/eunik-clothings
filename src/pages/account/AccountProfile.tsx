import { PageHeader } from "@/components/os/ui";
import ProfileForm from "@/components/os/ProfileForm";
import { useSession } from "@/context/SessionProvider";

export default function AccountProfile() {
  const { user } = useSession();
  if (!user) return null;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        subtitle="Name, tape preferences, address and a password that is only yours."
      />
      <ProfileForm user={user} />
    </div>
  );
}
