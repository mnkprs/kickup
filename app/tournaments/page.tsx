import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/profiles";
import { getTournaments } from "@/lib/db/tournaments";
import { TournamentsPageClient } from "@/components/tournaments-page-client";

export default async function TournamentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, tournaments] = await Promise.all([
    user ? getProfile(user.id) : null,
    getTournaments(),
  ]);

  return (
    <Suspense fallback={<div className="h-32 animate-pulse bg-muted/30 rounded-xl mx-5" />}>
      <TournamentsPageClient
        tournaments={tournaments}
        canCreate={profile?.is_field_owner ?? profile?.is_admin ?? false}
      />
    </Suspense>
  );
}
