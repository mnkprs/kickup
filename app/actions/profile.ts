"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  redirect("/auth/login");
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
