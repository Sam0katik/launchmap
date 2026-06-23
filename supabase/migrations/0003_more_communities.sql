-- Additive update for the LIVE database (which was seeded with the first 30
-- rows). Idempotent: re-running is safe. Run in the Supabase SQL editor.
--
--  1. Fix the redundant "Fri for Feedback Friday" best_time on r/startups.
--  2. Add 6 more real Reddit communities (skipped if already present by name).
--
-- ⚠️ The 6 new rows are knowledge-based (verified_at 2026-06-23) — re-check each
-- sub's live sidebar rules before relying on them in production.

update communities
set best_time = 'Feedback Friday thread; weekday mornings ET'
where name = 'r/startups';

insert into communities
  (platform, name, url, niche_tags, self_promo_policy, self_promo_note,
   rules_summary, karma_tier, karma_note, activity_level, best_time,
   submit_template, verified_at)
select v.platform, v.name, v.url, v.niche_tags, v.self_promo_policy,
       v.self_promo_note, v.rules_summary, v.karma_tier, v.karma_note,
       v.activity_level, v.best_time, v.submit_template, v.verified_at
from (values
  ('reddit', 'r/buildinpublic', 'https://www.reddit.com/r/buildinpublic/',
   '{"buildinpublic","indie","saas","maker","launch","solofounder"}'::text[],
   'welcome', 'Build-in-public community — sharing progress and launches is the whole point.',
   'Required: share real progress, numbers, or lessons. Removed: bare ad with no story.',
   'easy', 'Low barrier; participate a little first.', 'moderate', 'Tue-Thu mornings ET', null, '2026-06-23'::date),
  ('reddit', 'r/nocode', 'https://www.reddit.com/r/nocode/',
   '{"nocode","indie","saas","maker","webapp","launch"}'::text[],
   'welcome', 'No-code builders; sharing a tool or what you built is on-topic with context.',
   'Required: tie it to the no-code workflow; add detail. Removed: drive-by promo.',
   'easy', 'Low barrier.', 'moderate', 'Weekday mornings ET', null, '2026-06-23'::date),
  ('reddit', 'r/coolgithubprojects', 'https://www.reddit.com/r/coolgithubprojects/',
   '{"opensource","devtool","github","cli","launch","technical"}'::text[],
   'welcome', 'Open-source / GitHub projects, including your own, are welcome with a clear writeup.',
   'Required: link the repo + explain what it does and the stack. Removed: closed-source ads.',
   'easy', 'Low barrier; flair your post by language.', 'moderate', 'Weekday mornings ET', null, '2026-06-23'::date),
  ('reddit', 'r/GrowthHacking', 'https://www.reddit.com/r/GrowthHacking/',
   '{"growth","marketing","saas","startup","launch","b2b"}'::text[],
   'comment_only', 'Large but heavily moderated; promo only inside a real tactic or case study.',
   'Required: lead with a growth lesson/experiment. Removed: blatant self-promo.',
   'medium', 'Account history expected; new accounts filtered.', 'moderate', 'Weekday mornings ET', null, '2026-06-23'::date),
  ('reddit', 'r/startup', 'https://www.reddit.com/r/startup/',
   '{"startup","founder","saas","indie","launch","feedback"}'::text[],
   'welcome', 'General startup community; sharing for feedback is fine when framed as a question.',
   'Required: ask for specific feedback, add context. Removed: pure link drops.',
   'easy', 'Low barrier; some history helps.', 'moderate', 'Weekday mornings ET', null, '2026-06-23'::date),
  ('reddit', 'r/ladybusiness', 'https://www.reddit.com/r/ladybusiness/',
   '{"founder","smallbusiness","indie","saas","marketing","launch"}'::text[],
   'megathread_only', 'Supportive community for women founders; promo goes in the recurring share threads.',
   'Required: use the designated promo/share thread; contribute beyond your link.',
   'easy', 'Low barrier.', 'low', 'Share thread days; weekday mornings ET', null, '2026-06-23'::date)
) as v(platform, name, url, niche_tags, self_promo_policy, self_promo_note,
       rules_summary, karma_tier, karma_note, activity_level, best_time,
       submit_template, verified_at)
where not exists (select 1 from communities c where c.name = v.name);
