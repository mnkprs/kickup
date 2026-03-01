import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/db/profiles";
import { ProfileSettings } from "@/components/profile-settings";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profile, { data: extra }, { data: application }, { data: areasData }, { data: colorsData }] =
    await Promise.all([
      getProfile(user.id),
      supabase
        .from("profiles")
        .select("nationality, date_of_birth, height, preferred_foot, avatar_color")
        .eq("id", user.id)
        .single(),
      supabase
        .from("owner_applications")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("areas").select("name, city").order("city").order("sort"),
      supabase.from("avatar_colors").select("hex").order("sort"),
    ]);

  if (!profile) redirect("/auth/login");

  const cityMap: Record<string, string[]> = {};
  for (const row of areasData ?? []) {
    if (!cityMap[row.city]) cityMap[row.city] = [];
    cityMap[row.city].push(row.name);
  }
  const areaGroups = Object.entries(cityMap).map(([city, areas]) => ({ city, areas }));
  const colors = (colorsData ?? []).map((r) => r.hex);

  return (
    <ProfileSettings
      profile={profile}
      email={user.email ?? ""}
      extra={{
        nationality: extra?.nationality ?? null,
        date_of_birth: extra?.date_of_birth ?? null,
        height: extra?.height ?? null,
        preferred_foot: extra?.preferred_foot ?? null,
        avatar_color: extra?.avatar_color ?? profile.avatar_color,
      }}
      areaGroups={areaGroups}
      colors={colors}
      ownerApplication={application ? { status: application.status as string } : null}
    />
  );
}
