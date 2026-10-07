-- NFL Pick'em database (Supabase). Paste all of this into the SQL Editor and run it.
-- players: one row per name, with a hashed 4-digit PIN.
-- pick_log: every saved pick, never edited. The page counts a person's latest pick
-- saved before that game's kickoff, so changes after kickoff never count.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 24),
  name_key text not null unique,
  pin_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pick_log (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  season int not null,
  week int not null,
  game_id text not null,
  pick text not null,
  created_at timestamptz not null default now()
);
create index if not exists pick_log_season_week on public.pick_log (season, week);

alter table public.players enable row level security;
alter table public.pick_log enable row level security;
revoke all on public.players from anon, authenticated;
revoke insert, update, delete on public.pick_log from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.pick_log to anon, authenticated;
drop policy if exists "anyone can read picks" on public.pick_log;
create policy "anyone can read picks" on public.pick_log for select to anon, authenticated using (true);

create or replace view public.player_names as select id, name from public.players;
grant select on public.player_names to anon, authenticated;

create or replace function public.submit_picks(p_name text, p_pin text, p_season int, p_week int, p_picks jsonb)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_key text := lower(btrim(coalesce(p_name, '')));
  v_player public.players;
  v_k text;
  v_v text;
  v_n int := 0;
begin
  if char_length(v_key) not between 1 and 24 then raise exception 'bad_name'; end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4}$' then raise exception 'bad_pin'; end if;
  if p_picks is null or jsonb_typeof(p_picks) <> 'object' then raise exception 'bad_picks'; end if;
  if p_season not between 2020 and 2100 or p_week not between 1 and 25 then raise exception 'bad_week'; end if;
  select * into v_player from public.players where name_key = v_key;
  if not found then
    insert into public.players (name, name_key, pin_hash)
    values (btrim(p_name), v_key, crypt(p_pin, gen_salt('bf')))
    returning * into v_player;
  elsif v_player.pin_hash <> crypt(p_pin, v_player.pin_hash) then
    raise exception 'wrong_pin';
  end if;
  for v_k, v_v in select key, value #>> '{}' from jsonb_each(p_picks) loop
    exit when v_n >= 20;
    if (v_k ~ '^g[0-9]{1,2}$' and v_v ~ '^[A-Z]{2,3}$') or (v_k = 'tb' and v_v ~ '^[0-9]{1,3}$') then
      insert into public.pick_log (player_id, season, week, game_id, pick)
      values (v_player.id, p_season, p_week, v_k, v_v);
      v_n := v_n + 1;
    end if;
  end loop;
  return json_build_object('player_id', v_player.id, 'name', v_player.name, 'saved', v_n);
end $$;
revoke all on function public.submit_picks(text, text, int, int, jsonb) from public;
grant execute on function public.submit_picks(text, text, int, int, jsonb) to anon, authenticated;

-- Reset someone's PIN (run in the SQL Editor; they pick a new one on their next save):
-- delete from public.players where name_key = lower('Their Name');
-- Note: that also deletes their saved picks. To keep picks, set a new PIN instead:
-- update public.players set pin_hash = extensions.crypt('1234', extensions.gen_salt('bf')) where name_key = lower('Their Name');
