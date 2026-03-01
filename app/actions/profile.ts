"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const update: Record<string, string> = {};
  const fullName = formData.get("full_name");
  const position = formData.get("position");
  const area = formData.get("area");
  const bio = formData.get("bio");

  if (typeof fullName === "string" && fullName.trim()) update.full_name = fullName.trim();
  if (typeof position === "string") update.position = position;
  if (typeof area === "string") update.area = area;
  if (typeof bio === "string") update.bio = bio;

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
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
