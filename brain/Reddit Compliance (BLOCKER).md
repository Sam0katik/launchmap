# Reddit Compliance — THE BLOCKER

**Status: unresolved. This blocks payments and, as built, the paid features.**

## What happened (2026-07-14)
Dodo Payments **rejected onboarding**:

> "we can see there is a Terms of Service violation of Reddit. Can you please
> provide us with the agreement with Reddit and we will be happy to continue the
> review process."

Dodo is a **Merchant of Record** — they are legally on the hook for what they
process, so they check this. The rejection is **correct**, not a formality.
Any other MoR/processor (Paddle, LemonSqueezy, Stripe review) will find the same.

## Why we're in violation
Reddit's User Agreement + the **Responsible Builder Policy** (self-service access
closed late 2025):
- Automated access/collection of Reddit data is prohibited without a separate
  agreement.
- **"You must not sell, license, share, or otherwise commercialize Reddit data
  without express written approval."**
- Commercial use requires **explicit written approval / a negotiated license**
  (this is what killed GummySearch).
- Late May 2026: Reddit returns 403 on unauthenticated requests.

ZeroFans currently scrapes Reddit via Apify **and charges for it**:
- $2 unlock advertises "each sub's live mod-pinned rules"
- $0.50 live-thread finder
- $0.30 karma check
- admin scan pulling members + rules
→ textbook "commercializing Reddit data without approval".

## Emergency switch (zero code)
Every Apify feature is gated on `apifyConfigured()` = `!!process.env.APIFY_TOKEN`.
**Removing `APIFY_TOKEN` from Vercel instantly disables all scraping features.**

## The two real options
### A. Pivot to a compliant product (recommended, fast)
Keep only what we own or that is plain linking:
- our curated catalog of communities + our editorial rules summary / karma tier /
  best time (our own writing, not Reddit's data feed)
- AI analysis of the **user's own landing page**
- matching + ranking + posting briefs we wrote
- links to subreddits and submit forms
Drop: live thread finder, karma check, member/rules scraping.
Cost: lose 2 paid add-ons; keep the $2 unlock (our own IP).

### B. Get written approval from Reddit
Contact Reddit for commercial data access. Slow, opaque, frequently rejected,
and a licence has real cost. Not viable on this timeline.

## Do NOT
- Do not hide the scraping to get past a processor's review. That's fraud against
  the processor and still breaches Reddit's terms.
