create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique,
  email text unique,
  created_at timestamptz not null default now()
);
create table if not exists public.wordbooks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  last_studied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.words (
  id uuid primary key default uuid_generate_v4(),
  wordbook_id uuid not null references public.wordbooks(id) on delete cascade,
  term text not null,
  meaning text not null,
  phonetic text,
  status text not null default 'new' check (status in ('new','memorized','unknown')),
  created_at timestamptz not null default now()
);
create table if not exists public.game_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  time_limit int not null default 10 check (time_limit between 5 and 30),
  bgm_volume int not null default 70 check (bgm_volume between 0 and 100),
  sfx_volume int not null default 85 check (sfx_volume between 0 and 100),
  bgm_on boolean not null default true,
  sfx_on boolean not null default true
);
create table if not exists public.game_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wordbook_id uuid not null references public.wordbooks(id) on delete cascade,
  correct_count int not null default 0,
  survival_time int not null default 0,
  is_cleared boolean not null default false,
  played_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text unique;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;
alter table public.wordbooks add column if not exists last_studied_at timestamptz;
alter table public.words
  add column if not exists phonetic text,
  add column if not exists status text not null default 'new' check (status in ('new','memorized','unknown')),
  add column if not exists created_at timestamptz not null default now();
alter table public.game_settings
  add column if not exists bgm_volume int not null default 70,
  add column if not exists sfx_volume int not null default 85,
  add column if not exists bgm_on boolean not null default true,
  add column if not exists sfx_on boolean not null default true;
alter table public.game_records add column if not exists is_cleared boolean not null default false;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname, email)
  values (new.id, new.raw_user_meta_data ->> 'nickname', new.email);
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_email_taken(p_email text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from auth.users where lower(email) = lower(p_email));
$$;
create or replace function public.is_nickname_taken(p_nickname text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where nickname = p_nickname);
$$;
grant execute on function public.is_email_taken(text) to anon, authenticated;
grant execute on function public.is_nickname_taken(text) to anon, authenticated;

create or replace view public.wordbook_summary with (security_invoker = true) as
select b.id, b.user_id, b.title, b.created_at, b.last_studied_at,
       count(w.id)::int as word_count,
       (count(w.id) filter (where w.status = 'memorized'))::int as memorized_count,
       (select max(r.survival_time) from public.game_records r where r.wordbook_id = b.id) as best_time
from public.wordbooks b
left join public.words w on w.wordbook_id = b.id
group by b.id;

alter table public.profiles      enable row level security;
alter table public.wordbooks     enable row level security;
alter table public.words         enable row level security;
alter table public.game_settings enable row level security;
alter table public.game_records  enable row level security;

drop policy if exists "own profile"   on public.profiles;
drop policy if exists "own wordbooks" on public.wordbooks;
drop policy if exists "own settings"  on public.game_settings;
drop policy if exists "own records"   on public.game_records;
drop policy if exists "own words"     on public.words;

create policy "own profile"   on public.profiles      for all using (id = auth.uid())      with check (id = auth.uid());
create policy "own wordbooks" on public.wordbooks     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own settings"  on public.game_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own records"   on public.game_records  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own words" on public.words for all
  using (exists (select 1 from public.wordbooks b where b.id = wordbook_id and b.user_id = auth.uid()))
  with check (exists (select 1 from public.wordbooks b where b.id = wordbook_id and b.user_id = auth.uid()));
