// Admin allowlist. Two ways to grant admin access (either one is enough):
//   - ADMIN_EMAILS    — comma-separated emails (the address your account signs
//                       in with). Note: GitHub OAuth only exposes an email if
//                       your GitHub email is public, so this can be empty.
//   - ADMIN_USERNAMES — comma-separated GitHub logins (e.g. "Sam0katik").
//                       More reliable for GitHub sign-in. Always available.
// Empty lists = nobody is an admin.

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

/** True if either the email or the GitHub username is on an allowlist. */
export function isAdminUser(opts: {
  email?: string | null;
  username?: string | null;
}): boolean {
  return isAdminEmail(opts.email) || isAdminUsername(opts.username);
}
