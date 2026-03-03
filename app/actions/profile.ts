"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { searchProfiles } from "@/lib/db/profiles";

const THEME_COOKIE = "kickup-theme";

export async function updateProfileAction(data: {
  full_name: string;
  avatar_color: string;
  position: string | null;
  area: string | null;
  bio: string;
  nationality: string;
  date_of_birth: string;
  height: string;
  preferred_foot: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const name = data.full_name.trim();
  if (!name) return { error: "Name is required" };

  const avatar_initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: name,
      avatar_initials,
      avatar_color: data.avatar_color,
      position: data.position || null,
      area: data.area || null,
      bio: data.bio.trim(),
      nationality: data.nationality.trim() || null,
      date_of_birth: data.date_of_birth || null,
      height: data.height ? parseInt(data.height) : null,
      preferred_foot: data.preferred_foot || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}

export async function updateEmailAction(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: email.trim() });
  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePasswordAction(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(THEME_COOKIE);
  redirect("/auth/login");
}

export async function getNotificationsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as import("@/lib/types").Notification[];
}

export async function markNotificationsReadAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  revalidatePath("/");
}

export async function updateFreelancerAction(data: {
  is_freelancer: boolean;
  freelancer_until?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({
      is_freelancer: data.is_freelancer,
      freelancer_until: data.freelancer_until || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/find-players");
  return { success: true };
}

export async function getPreferredThemeAction(): Promise<"light" | "dark"> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(THEME_COOKIE)?.value;
  if (fromCookie === "light" || fromCookie === "dark") {
    return fromCookie;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "dark";

  const { data } = await supabase
    .from("profiles")
    .select("preferred_theme")
    .eq("id", user.id)
    .single();

  const theme = data?.preferred_theme as "light" | "dark" | null;
  return theme === "light" || theme === "dark" ? theme : "dark";
}

export async function updateThemeAction(theme: "light" | "dark") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_theme: theme })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, theme, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  revalidatePath("/");
  revalidatePath("/profile");
  return { success: true };
}

export async function updateAvatarUrlAction(avatarUrl: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/profile");
  return { success: true };
}

export async function searchProfilesAction(query: string, limit = 20) {
  return searchProfiles(query, limit);
}

export async function applyForFieldOwnerAction(message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("owner_applications")
    .upsert(
      { user_id: user.id, message, status: "pending" },
      { onConflict: "user_id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}
