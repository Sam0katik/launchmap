import type { User } from "@supabase/supabase-js";

// Admin allowlist. Three ways to grant admin access (any one is enough):
//   - ADMIN_USER_IDS  — comma-separated Supabase auth user UUIDs (Supabase →
//                       Authentication → Users). Most robust: can't be changed
//                       by the user.
//   - ADMIN_USERNAMES — comma-separated GitHub logins (e.g. "Sam0katik"),
//                       matched against the login GitHub itself reported in the
//                       OAuth identity — NOT user_metadata (see below).
//   - ADMIN_EMAILS    — comma-separated emails. GitHub OAuth only exposes an
//                       email if it's public on GitHub, so this can be empty.
// Empty lists = nobody is an admin.
//
// SECURITY: never read the login from `user.user_metadata`. Supabase lets any
// signed-in user rewrite their own user_metadata (`auth.updateUser({ data })`)
// with the public anon key, so a check on `user_metadata.user_name` would let
// anyone become admin by setting it to the owner's GitHub login. The identity
// record (`user.identities[].identity_data`) is written from the provider's
// response on each OAuth login and is not user-editable.

function allowlist(envVar: string | undefined): string[] {
  return (envVar ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowlist(process.env.ADMIN_EMAILS).includes(email.toLowerCase());
}

export function isAdminUsername(username: string | null | undefined): boolean {
  if (!username) return false;
  return allowlist(process.env.ADMIN_USERNAMES).includes(username.toLowerCase());
}

export function isAdminUserId(id: string | null | undefined): boolean {
  if (!id) return false;
  return allowlist(process.env.ADMIN_USER_IDS).includes(id.toLowerCase());
}

/** GitHub login as reported by GitHub in the OAuth identity (provider-sourced). */
export function githubLogin(user: User): string | null {
  const gh = (user.identities ?? []).find((i) => i.provider === "github");
  const data = (gh?.identity_data ?? {}) as Record<string, unknown>;
  const login = data.user_name ?? data.preferred_username;
  return typeof login === "string" && login ? login : null;
}

/** True if the signed-in user is on any admin allowlist. */
export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return (
    isAdminUserId(user.id) ||
    isAdminUsername(githubLogin(user)) ||
    isAdminEmail(user.email)
  );
}
