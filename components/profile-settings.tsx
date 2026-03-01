"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Shield,
  Trophy,
  LogOut,
  Eye,
  EyeOff,
  Clock,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import type { Profile, AreaGroup } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { ColorSwatchPicker } from "@/components/color-swatch-picker";
import { AreaGroupSelect } from "@/components/area-group-select";
import {
  updateProfileAction,
  updateEmailAction,
  updatePasswordAction,
  signOutAction,
  applyForFieldOwnerAction,
} from "@/app/actions/profile";

type Section = null | "player" | "security" | "field-owner" | "account";

interface ProfileExtra {
  nationality: string | null;
  date_of_birth: string | null;
  height: number | null;
  preferred_foot: string | null;
  avatar_color: string;
}

interface ProfileSettingsProps {
  profile: Profile;
  email: string;
  extra: ProfileExtra;
  areaGroups: AreaGroup[];
  colors: string[];
  ownerApplication: { status: string } | null;
}

const POSITIONS = ["GK", "DEF", "MID", "FWD"];
const FEET = ["left", "right", "both"];

function SectionHeader({
  title,
  onBack,
  onSave,
  saving,
  canSave,
}: {
  title: string;
  onBack: () => void;
  onSave?: () => void;
  saving?: boolean;
  canSave?: boolean;
}) {
  return (
    <header className="px-5 pt-12 pb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <h1 className="text-foreground font-semibold text-lg">{title}</h1>
      </div>
      {onSave && (
        <button
          onClick={onSave}
          disabled={!canSave || saving}
          className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          {saving ? (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
          ) : (
            "Save"
          )}
        </button>
      )}
    </header>
  );
}

export function ProfileSettings({
  profile,
  email,
  extra,
  areaGroups,
  colors,
  ownerApplication,
}: ProfileSettingsProps) {
  const router = useRouter();
  const [section, setSection] = useState<Section>(null);

  // Player info state
  const [fullName, setFullName] = useState(profile.full_name);
  const [avatarColor, setAvatarColor] = useState(extra.avatar_color);
  const [position, setPosition] = useState<string | null>(profile.position);
  const [area, setArea] = useState<string | null>(profile.area ?? null);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [nationality, setNationality] = useState(extra.nationality ?? "");
  const [dob, setDob] = useState(extra.date_of_birth ?? "");
  const [height, setHeight] = useState(extra.height?.toString() ?? "");
  const [preferredFoot, setPreferredFoot] = useState<string | null>(extra.preferred_foot);
  const [playerSaving, setPlayerSaving] = useState(false);
  const [playerError, setPlayerError] = useState("");

  // Security state
  const [newEmail, setNewEmail] = useState(email);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [securityMsg, setSecurityMsg] = useState("");
  const [securityError, setSecurityError] = useState("");

  // Field owner state
  const [applyMessage, setApplyMessage] = useState("");
  const [applySaving, setApplySaving] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [application, setApplication] = useState(ownerApplication);

  async function savePlayer() {
    setPlayerSaving(true);
    setPlayerError("");
    const result = await updateProfileAction({
      full_name: fullName,
      avatar_color: avatarColor,
      position,
      area,
      bio,
      nationality,
      date_of_birth: dob,
      height,
      preferred_foot: preferredFoot,
    });
    setPlayerSaving(false);
    if (result.error) { setPlayerError(result.error); return; }
    router.refresh();
    setSection(null);
  }

  async function saveEmail() {
    if (newEmail === email) return;
    setEmailSaving(true);
    setSecurityError("");
    setSecurityMsg("");
    const result = await updateEmailAction(newEmail);
    setEmailSaving(false);
    if (result.error) { setSecurityError(result.error); return; }
    setSecurityMsg(`Confirmation sent to ${newEmail}`);
  }

  async function savePassword() {
    if (newPassword.length < 8) { setSecurityError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setSecurityError("Passwords do not match"); return; }
    setPasswordSaving(true);
    setSecurityError("");
    setSecurityMsg("");
    const result = await updatePasswordAction(newPassword);
    setPasswordSaving(false);
    if (result.error) { setSecurityError(result.error); return; }
    setNewPassword("");
    setConfirmPassword("");
    setSecurityMsg("Password updated");
  }

  async function applyForOwner() {
    setApplySaving(true);
    setApplyError("");
    const result = await applyForFieldOwnerAction(applyMessage);
    setApplySaving(false);
    if (result.error) { setApplyError(result.error); return; }
    setApplication({ status: "pending" });
  }

  // ─── Hub ────────────────────────────────────────────────────────────────────
  if (section === null) {
    const initials = fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");

    return (
      <>
        <header className="px-5 pt-12 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
            >
              <ArrowLeft size={18} className="text-muted-foreground" />
            </Link>
            <h1 className="text-foreground font-semibold text-lg">Settings</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="px-5 pb-24 flex flex-col gap-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 py-4 px-4 rounded-xl bg-card border border-border">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center shrink-0 ring-2 ring-accent/20"
              style={{ backgroundColor: avatarColor }}
            >
              <span className="text-accent-foreground font-bold text-lg">{initials || "?"}</span>
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm">{profile.full_name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{email}</p>
            </div>
          </div>

          {/* Menu */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            {[
              { key: "player", icon: User, label: "Player Info", desc: "Name, position, area, bio" },
              { key: "security", icon: Shield, label: "Security", desc: "Email and password" },
              { key: "field-owner", icon: Trophy, label: "Field Owner", desc: profile.is_field_owner ? "Active" : application ? "Application pending" : "Apply to become a field owner" },
            ].map(({ key, icon: Icon, label, desc }, i, arr) => (
              <button
                key={key}
                onClick={() => setSection(key as Section)}
                className={`w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors text-left ${i < arr.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium">{label}</p>
                  <p className="text-muted-foreground text-xs truncate">{desc}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOutAction()}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <LogOut size={17} className="text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-destructive text-sm font-medium">Sign Out</p>
            </div>
          </button>
        </main>
      </>
    );
  }

  // ─── Player Info ─────────────────────────────────────────────────────────────
  if (section === "player") {
    return (
      <>
        <SectionHeader
          title="Player Info"
          onBack={() => setSection(null)}
          onSave={savePlayer}
          saving={playerSaving}
          canSave={fullName.trim().length > 0}
        />
        <main className="px-5 pb-24 flex flex-col gap-5">
          {/* Avatar color */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
              Avatar Color
            </label>
            <ColorSwatchPicker colors={colors} value={avatarColor} onChange={setAvatarColor} />
          </div>

          {/* Full name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={60}
              className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Position */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Position
            </label>
            <div className="flex gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPosition(position === p ? null : p)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    position === p
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Area
            </label>
            <AreaGroupSelect
              areaGroups={areaGroups}
              value={area ?? ""}
              onChange={(v) => setArea(v || null)}
            />
          </div>

          {/* Preferred foot */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Preferred Foot
            </label>
            <div className="flex gap-2">
              {FEET.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setPreferredFoot(preferredFoot === f ? null : f)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all border ${
                    preferredFoot === f
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Height + Nationality side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min={100}
                max={230}
                placeholder="e.g. 178"
                className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Nationality
              </label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="e.g. Greek"
                className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Date of birth */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Tell others about yourself..."
              className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors resize-none"
            />
            <p className="text-muted-foreground text-xs mt-1 text-right">{bio.length}/200</p>
          </div>

          {playerError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 text-center">
              {playerError}
            </p>
          )}
        </main>
      </>
    );
  }

  // ─── Security ────────────────────────────────────────────────────────────────
  if (section === "security") {
    return (
      <>
        <SectionHeader title="Security" onBack={() => { setSecurityMsg(""); setSecurityError(""); setSection(null); }} />
        <main className="px-5 pb-24 flex flex-col gap-6">
          {/* Email */}
          <div className="rounded-xl bg-card border border-border p-4 flex flex-col gap-4">
            <p className="text-foreground font-semibold text-sm">Email Address</p>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
            />
            <button
              onClick={saveEmail}
              disabled={emailSaving || newEmail === email || !newEmail.includes("@")}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {emailSaving ? (
                <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
              ) : "Update Email"}
            </button>
          </div>

          {/* Password */}
          <div className="rounded-xl bg-card border border-border p-4 flex flex-col gap-4">
            <p className="text-foreground font-semibold text-sm">Change Password</p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full rounded-xl bg-background border border-border px-4 py-3 pr-12 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
            />
            <button
              onClick={savePassword}
              disabled={passwordSaving || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {passwordSaving ? (
                <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
              ) : "Update Password"}
            </button>
          </div>

          {securityMsg && (
            <p className="text-sm text-win bg-win/10 rounded-xl px-4 py-3 text-center">{securityMsg}</p>
          )}
          {securityError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 text-center">{securityError}</p>
          )}
        </main>
      </>
    );
  }

  // ─── Field Owner ─────────────────────────────────────────────────────────────
  if (section === "field-owner") {
    return (
      <>
        <SectionHeader title="Field Owner" onBack={() => setSection(null)} />
        <main className="px-5 pb-24 flex flex-col gap-5">
          {profile.is_field_owner ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-win/10 border border-win/20">
              <CheckCircle2 size={20} className="text-win shrink-0" />
              <div>
                <p className="text-foreground font-semibold text-sm">Field Owner</p>
                <p className="text-muted-foreground text-xs mt-0.5">You can create and manage leagues.</p>
              </div>
            </div>
          ) : application?.status === "pending" ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-draw/10 border border-draw/20">
              <Clock size={20} className="text-draw shrink-0" />
              <div>
                <p className="text-foreground font-semibold text-sm">Application Under Review</p>
                <p className="text-muted-foreground text-xs mt-0.5">We'll notify you once reviewed.</p>
              </div>
            </div>
          ) : application?.status === "rejected" ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <XCircle size={20} className="text-destructive shrink-0" />
              <div>
                <p className="text-foreground font-semibold text-sm">Application Not Approved</p>
                <p className="text-muted-foreground text-xs mt-0.5">Contact support for more info.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-foreground font-semibold text-sm mb-1">Become a Field Owner</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Field owners can create and manage leagues. Tell us about your field and why you'd like to join.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Message <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Tell us about your field..."
                  rows={4}
                  className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors resize-none"
                />
              </div>
              {applyError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 text-center">{applyError}</p>
              )}
              <button
                onClick={applyForOwner}
                disabled={applySaving}
                className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {applySaving ? (
                  <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                ) : "Submit Application"}
              </button>
            </>
          )}
        </main>
      </>
    );
  }

  return null;
}
