"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrlAction } from "@/app/actions/profile";
import type { Profile } from "@/lib/types";

interface AvatarUploadProps {
  profile: Profile;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
  /** When true, clicking the avatar triggers file picker for upload */
  editable?: boolean;
}

const sizeClasses = {
  sm: "h-11 w-11 text-sm",
  md: "h-14 w-14 text-lg",
  lg: "h-20 w-20 text-xl",
};

export function AvatarUpload({
  profile,
  size = "md",
  className = "",
  children,
  editable = true,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile.id) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const allowed = ["jpeg", "jpg", "png", "webp", "gif"];
    if (!allowed.includes(ext)) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${profile.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const result = await updateAvatarUrlAction(data.publicUrl);
      if (result.error) throw new Error(result.error);

      router.refresh();
    } catch {
      // Silent fail for now; could add toast
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const sizeClass = sizeClasses[size];
  const avatarContent = (
    <div
      className={`relative rounded-full flex items-center justify-center overflow-hidden shrink-0 ${sizeClass} ${className}`}
      style={
        !profile.avatar_url
          ? { backgroundColor: profile.avatar_color ?? "var(--color-accent)" }
          : undefined
      }
    >
      {profile.avatar_url ? (
        <Image
          src={profile.avatar_url}
          alt={profile.full_name}
          width={size === "lg" ? 80 : size === "md" ? 56 : 44}
          height={size === "lg" ? 80 : size === "md" ? 56 : 44}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-accent-foreground font-bold">
          {profile.avatar_initials}
        </span>
      )}
      {children}
    </div>
  );

  if (!editable) return avatarContent;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background rounded-full disabled:opacity-70"
        aria-label="Upload profile photo"
      >
        {avatarContent}
        {uploading && (
          <span className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center">
            <span className="h-5 w-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          </span>
        )}
      </button>
    </>
  );
}
