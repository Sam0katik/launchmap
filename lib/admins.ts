// Admin allowlist. Set ADMIN_EMAILS to a comma-separated list of the email
// addresses allowed into /admin (use the email your GitHub account signs in
// with). Empty = nobody is an admin.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
