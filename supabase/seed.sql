-- LaunchMap seed data — starter set for the "vibe-coders / indie SaaS" niche.
--
-- ⚠️ DATA-ACCURACY NOTE (read before production):
-- These rows are STARTING ESTIMATES based on each community's well-known public
-- posture as of 2026-06. Per the spec's core principle ("stale rules = a banned
-- user"), every row MUST be manually re-verified against the live community
-- rules before launch, and re-checked monthly. verified_at reflects when the
-- row was last hand-checked — keep it honest.
--
-- Idempotent: clears and reloads the seed set.

truncate table communities restart identity cascade;

insert into communities
  (platform, name, url, niche_tags, self_promo_policy, self_promo_note,
   rules_summary, karma_tier, karma_note, activity_level, best_time,
   submit_template, verified_at)
values
  ('reddit', 'r/SideProject', 'https://www.reddit.com/r/SideProject/',
   '{saas,indie,vibecoders,sideproject,ai,webapp,launch}',
   'welcome',
   'Sharing what you built is the point of the sub. Keep it genuine, no pure ad copy.',
   'Removed: low-effort drops with no context. Required: explain what it is and why you built it; engage with comments.',
   'easy', 'New accounts tolerated; light karma history helps avoid spam filter.',
   'active', 'Tue-Thu 9-12 ET',
   null, '2026-06-17'),

  ('reddit', 'r/SaaS', 'https://www.reddit.com/r/SaaS/',
   '{saas,b2b,indie,startup,launch,pricing}',
   'megathread_only',
   'Direct promo is limited; use the weekly self-promo / feedback threads.',
   'Removed: standalone launch posts outside allowed threads. Required: contribute discussion, not just links.',
   'medium', 'Some history expected; brand-new accounts often filtered.',
   'active', 'Mon-Wed 8-11 ET',
   null, '2026-06-17'),

  ('reddit', 'r/microsaas', 'https://www.reddit.com/r/microsaas/',
   '{microsaas,saas,indie,bootstrapped,solofounder,launch}',
   'welcome',
   'Build-in-public and small-launch posts welcome when they add insight.',
   'Removed: spammy repeat self-promo. Required: share numbers/learnings, not just a link.',
   'easy', 'Low barrier; basic account age helps.',
   'moderate', 'Tue-Thu 10-13 ET',
   null, '2026-06-17'),

  ('reddit', 'r/alphaandbetausers', 'https://www.reddit.com/r/alphaandbetausers/',
   '{beta,earlyaccess,feedback,indie,testers,launch}',
   'welcome',
   'Purpose-built for recruiting early users/testers — promo expected here.',
   'Required: clearly label stage (alpha/beta) and what feedback you want.',
   'easy', 'Minimal karma needs.',
   'low', 'Any weekday morning ET',
   null, '2026-06-17'),

  ('reddit', 'r/Entrepreneur', 'https://www.reddit.com/r/Entrepreneur/',
   '{startup,business,founder,saas,marketing}',
   'megathread_only',
   'Strict on self-promo; use the designated threads only.',
   'Removed: launch/promo posts in the main feed. Required: high-effort discussion contributions.',
   'hard', 'Established account + comment karma strongly recommended.',
   'active', 'Mon/Thu 9-12 ET',
   null, '2026-06-17'),

  ('directory', 'BetaList', 'https://betalist.com/submit',
   '{beta,earlyaccess,startup,waitlist,saas,launch}',
   'welcome',
   'Curated early-stage startup directory; strong email subscriber base for beta signups.',
   'Required: submit via their form; manual curation, can take time / has a paid skip-the-line option.',
   'easy', 'No account-karma concept; quality bar is editorial.',
   'moderate', 'N/A — submission-based',
   null, '2026-06-17'),

  ('directory', 'Indie Hackers', 'https://www.indiehackers.com/',
   '{indie,bootstrapped,saas,solofounder,buildinpublic,launch}',
   'welcome',
   'Community for bootstrapped founders; Product-Hunt-style exposure without the extreme competition.',
   'Required: post in the right group, lead with the story/lessons, not a bare link.',
   'easy', 'No karma gate; reputation builds via genuine participation.',
   'moderate', 'Tue-Thu mornings ET',
   null, '2026-06-17');
