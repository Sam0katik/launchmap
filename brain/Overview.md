# Overview

**ZeroFans** (formerly LaunchMap): paste a product URL → get a ranked **map**
of where an indie maker should launch — Reddit communities + directories — each
with rules, a karma bar, best time to post, and a rule-based posting brief.

## Who
- Solo/indie makers looking for their first users without getting banned.
- Operator is the sole dev, iterates fast, Russian-speaking.

## Money model (must preserve — see [[Billing & Economy]])
- **No subscriptions.**
- Account keeps **max 2 maps**; delete one to free a slot.
- **Unlock a map** = one-time **$2** from internal USD balance → all publics +
  posting briefs.
- **Where to jump in** (live Reddit threads): first search per map **free**
  (included in unlock), refresh **$0.50** (with a confirm step).
- **Karma check** **$0.30** per check, up to **3** saved Reddit accounts,
  **requires ≥1 unlocked map**.
- **Top-up** goes through Platega (hosted checkout, RUB rails); off until the
  merchant credentials are set
  (see [[Payments]]). Admin grants test credit meanwhile.

## Non-negotiables
- **Data is real, never fabricated.** No invented member counts / karma / rules.
  If unverified → leave empty. See [[Security]].
- Verify `npm run build` (and `npm run typecheck` on type changes) before
  claiming done.

See also: [[Architecture]] · [[Reddit & Apify]] · [[Decisions Log]]
