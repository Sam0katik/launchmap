-- New-user database: a profile row per signed-up user, created automatically
-- on signup. Auth identities live in Supabase's managed auth.users; this adds
-- the app-level profile (plan, daily run usage, timestamps).
--
-- Security: RLS on; a user can read/update only their own profile. Inserts are
-- done by a SECURITY DEFINER trigger (not by clients).

create table if not exists profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text,
  avatar_url    text,
  plan          text not null default 'free',        -- free | paid
  runs_today    int  not null default 0,
  runs_reset_at date not null default current_date,  -- daily limit window
  created_at    timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "users read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "users update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile when a new auth user is created.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
