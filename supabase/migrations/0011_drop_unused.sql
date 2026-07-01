-- Remove legacy / unused schema. All of these are confirmed unused by the app:
--   * profiles.plan / runs_today / runs_reset_at — the old per-day-limit + plan
--     model (replaced by the per-account map cap + internal balance).
--   * runs.checklist — the launch-checklist feature was removed.
--   * drafts / draft_regens — per-post AI draft generation was removed.
--
-- ⚠️ Destructive: this drops columns and tables (and any data in them). Safe
-- because nothing reads them, but it can't be undone. Run after 0001–0010.

alter table profiles drop column if exists plan;
alter table profiles drop column if exists runs_today;
alter table profiles drop column if exists runs_reset_at;

alter table runs drop column if exists checklist;

drop table if exists draft_regens;
drop table if exists drafts;
