import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { startUserScrape, apifyConfigured } from "@/lib/apify";

// POST /api/reddit/karma/start  Body: { username }
// Kick off an Apify scrape of a Reddit user profile (public karma + age).
// Signed-in only. Poll /api/reddit/karma/result with the returned run id.
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  username: z
    .string()
    .min(1)
    .max(40)
    .transform((s) => s.replace(/^u\//i, "").trim())
    .refine((s) => /^[\w-]+$/.test(s), "invalid"),
});

export async function POST(req: NextRequest) {
  if (!apifyConfigured()) {
    return NextResponse.json({ error: "apify_off" }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  const started = await startUserScrape(parsed.data.username);
  if ("error" in started) {
    return NextResponse.json(
      { error: "start_failed", detail: started.error },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, apifyRunId: started.runId });
}
