import { ScrambleText } from "@/components/ScrambleText";
import { AuthButton } from "@/components/AuthButton";

// Shared top bar for inner pages (map, profile, legal). Mirrors the landing
// header — wordmark on the left, the account menu on the right. The signed-in
// name button (with Profile + Sign out inside it) lives in AuthButton.
export function SiteNav() {
  return (
    <header className="relative z-20 flex h-20 items-center justify-between px-8">
      <a href="/" className="wordmark text-4xl text-ink hover:text-primary">
        <ScrambleText text="ZEROFANS" className="leading-none" />
      </a>
      <AuthButton />
    </header>
  );
}
