-- Execute uma vez no SQL Editor do seu projeto Supabase.
-- A chave secreta é usada SOMENTE pela função de servidor da Vercel.
create table if not exists public.interface_settings (
  id text primary key,
  value text not null
);
create table if not exists public.interface_classes (
  id uuid primary key,
  name text not null,
  code text unique not null,
  released integer[] not null default '{}',
  enrollment_open boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.interface_students (
  id uuid primary key,
  class_id uuid not null references public.interface_classes(id),
  name text not null,
  access_code text unique not null,
  pin_hash text not null,
  version integer not null default 1,
  official_grade numeric check (official_grade >= 0 and official_grade <= 10),
  grade_note text,
  created_at timestamptz not null default now()
);
create table if not exists public.interface_subjects (
  id uuid primary key,
  name text not null,
  description text not null default '',
  system_key text unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.interface_subjects add column if not exists system_key text unique;
create unique index if not exists interface_subjects_name_ci on public.interface_subjects(lower(name));
create table if not exists public.interface_class_subjects (
  id uuid primary key,
  class_id uuid not null references public.interface_classes(id) on delete cascade,
  subject_id uuid not null references public.interface_subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(class_id,subject_id)
);
create table if not exists public.interface_question_banks (
  id uuid primary key,
  subject_id uuid not null references public.interface_subjects(id) on delete cascade,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  unique(subject_id,name)
);
create table if not exists public.interface_questions (
  id uuid primary key,
  bank_id uuid not null references public.interface_question_banks(id) on delete cascade,
  statement text not null,
  options jsonb not null,
  correct integer not null check (correct >= 0 and correct <= 4),
  explanation text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.interface_simulations (
  id uuid primary key,
  class_id uuid not null references public.interface_classes(id) on delete cascade,
  subject_id uuid not null references public.interface_subjects(id),
  bank_id uuid not null references public.interface_question_banks(id),
  bank_revision integer not null,
  title text not null,
  question_count integer not null check (question_count between 1 and 50),
  max_xp integer not null check (max_xp between 0 and 1000),
  status text not null default 'draft' check (status in ('draft','open','closed')),
  questions jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.interface_simulation_attempts (
  id uuid primary key,
  simulation_id uuid not null references public.interface_simulations(id) on delete cascade,
  student_id uuid not null references public.interface_students(id) on delete cascade,
  answers jsonb not null default '[]',
  score integer,
  xp integer not null default 0 check (xp between 0 and 1000),
  status text not null default 'started' check (status in ('started','completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(simulation_id,student_id)
);
create table if not exists public.interface_xp_events (
  id uuid primary key,
  student_id uuid not null references public.interface_students(id) on delete cascade,
  class_id uuid not null references public.interface_classes(id) on delete cascade,
  source_type text not null check (source_type in ('simulation','duel','manual')),
  source_id uuid not null,
  xp integer not null check (xp >= 0 and xp <= 1000),
  description text not null,
  created_at timestamptz not null default now(),
  unique(student_id,source_type,source_id)
);
create table if not exists public.interface_championships (
  id uuid primary key,
  class_id uuid not null references public.interface_classes(id) on delete cascade,
  subject_id uuid not null references public.interface_subjects(id),
  bank_id uuid not null references public.interface_question_banks(id),
  bank_revision integer not null,
  title text not null,
  question_count integer not null check (question_count between 1 and 20),
  duel_xp integer not null check (duel_xp between 0 and 500),
  winner_bonus integer not null check (winner_bonus between 0 and 500),
  duration_seconds integer not null default 90 check (duration_seconds between 30 and 600),
  status text not null default 'registration' check (status in ('registration','active','finished')),
  question_pool jsonb not null,
  champion_id uuid references public.interface_students(id),
  runner_up_id uuid references public.interface_students(id),
  third_id uuid references public.interface_students(id),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create table if not exists public.interface_championship_participants (
  id uuid primary key,
  championship_id uuid not null references public.interface_championships(id) on delete cascade,
  student_id uuid not null references public.interface_students(id) on delete cascade,
  disqualified boolean not null default false,
  disqualification_reason text,
  disqualified_at timestamptz,
  joined_at timestamptz not null default now(),
  unique(championship_id,student_id)
);
alter table public.interface_championships add column if not exists leveling_question_count integer not null default 10 check (leveling_question_count between 1 and 50);
alter table public.interface_championships add column if not exists leveling_questions jsonb not null default '[]';
alter table public.interface_championships drop constraint if exists interface_championships_status_check;
alter table public.interface_championships add constraint interface_championships_status_check check (status in ('registration','leveling','active','finished'));
alter table public.interface_championship_participants add column if not exists disqualified boolean not null default false;
alter table public.interface_championship_participants add column if not exists disqualification_reason text;
alter table public.interface_championship_participants add column if not exists disqualified_at timestamptz;
alter table public.interface_championship_participants add column if not exists leveling_status text not null default 'pending' check (leveling_status in ('pending','started','completed'));
alter table public.interface_championship_participants add column if not exists leveling_score integer;
alter table public.interface_championship_participants add column if not exists leveling_time integer;
alter table public.interface_championship_participants add column if not exists leveling_answers jsonb not null default '[]';
alter table public.interface_championship_participants add column if not exists leveling_started_at timestamptz;
alter table public.interface_championship_participants add column if not exists leveling_completed_at timestamptz;
create table if not exists public.interface_duel_matches (
  id uuid primary key,
  championship_id uuid not null references public.interface_championships(id) on delete cascade,
  round integer not null,
  slot integer not null,
  kind text not null default 'main' check (kind in ('main','third')),
  player1_id uuid references public.interface_students(id),
  player2_id uuid references public.interface_students(id),
  winner_id uuid references public.interface_students(id),
  loser_id uuid references public.interface_students(id),
  player1_score integer,
  player2_score integer,
  player1_time integer,
  player2_time integer,
  status text not null default 'open' check (status in ('open','finished')),
  questions jsonb not null,
  created_at timestamptz not null default now(),
  unique(championship_id,round,slot,kind)
);
create table if not exists public.interface_duel_attempts (
  id uuid primary key,
  match_id uuid not null references public.interface_duel_matches(id) on delete cascade,
  student_id uuid not null references public.interface_students(id) on delete cascade,
  answers jsonb not null default '[]',
  score integer,
  elapsed_ms integer,
  status text not null default 'started' check (status in ('started','completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(match_id,student_id)
);
create table if not exists public.interface_focus_events (
  id uuid primary key,
  championship_id uuid not null references public.interface_championships(id) on delete cascade,
  match_id uuid not null references public.interface_duel_matches(id) on delete cascade,
  student_id uuid not null references public.interface_students(id) on delete cascade,
  event_type text not null check (event_type in ('hidden','visible')),
  created_at timestamptz not null default now()
);
alter table public.interface_championships add column if not exists duration_seconds integer not null default 90 check (duration_seconds between 30 and 600);
create table if not exists public.interface_submissions (
  id uuid primary key,
  student_id uuid not null references public.interface_students(id),
  class_id uuid not null references public.interface_classes(id),
  task_id text not null,
  lesson_id integer not null check (lesson_id between 1 and 10),
  payload jsonb not null,
  status text not null check (status in ('pending','approved','revision')),
  xp integer not null default 0 check (xp >= 0 and xp <= 180),
  feedback text not null,
  updated_at timestamptz not null default now(),
  unique (student_id, task_id)
);
create index if not exists interface_students_class on public.interface_students(class_id);
create index if not exists interface_submissions_student on public.interface_submissions(student_id);
create index if not exists interface_submissions_class on public.interface_submissions(class_id);
create index if not exists interface_class_subjects_class on public.interface_class_subjects(class_id);
create index if not exists interface_class_subjects_subject on public.interface_class_subjects(subject_id);
create index if not exists interface_question_banks_subject on public.interface_question_banks(subject_id);
create index if not exists interface_questions_bank on public.interface_questions(bank_id);
create index if not exists interface_simulations_class on public.interface_simulations(class_id);
create index if not exists interface_simulation_attempts_student on public.interface_simulation_attempts(student_id);
create index if not exists interface_xp_events_student on public.interface_xp_events(student_id);
create index if not exists interface_championships_class on public.interface_championships(class_id);
create index if not exists interface_championship_participants_championship on public.interface_championship_participants(championship_id);
create index if not exists interface_duel_matches_championship on public.interface_duel_matches(championship_id);
create index if not exists interface_duel_attempts_match on public.interface_duel_attempts(match_id);
create index if not exists interface_focus_events_match on public.interface_focus_events(match_id);
create table if not exists public.interface_limits (
  id text primary key,
  hits integer not null default 1,
  created_at timestamptz not null default now()
);
create table if not exists public.interface_schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);
insert into public.interface_schema_migrations(id) values ('evoluindo-2026-11-08-v1') on conflict do nothing;
create or replace function public.interface_take_limit(p_key text,p_max integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  insert into interface_limits(id,hits) values(p_key,1)
  on conflict(id) do update set hits=interface_limits.hits+1
  returning hits into n;
  delete from interface_limits where created_at < now()-interval '1 day';
  return n <= p_max;
end;
$$;
alter table public.interface_settings enable row level security;
alter table public.interface_classes enable row level security;
alter table public.interface_subjects enable row level security;
alter table public.interface_class_subjects enable row level security;
alter table public.interface_question_banks enable row level security;
alter table public.interface_questions enable row level security;
alter table public.interface_simulations enable row level security;
alter table public.interface_simulation_attempts enable row level security;
alter table public.interface_xp_events enable row level security;
alter table public.interface_championships enable row level security;
alter table public.interface_championship_participants enable row level security;
alter table public.interface_duel_matches enable row level security;
alter table public.interface_duel_attempts enable row level security;
alter table public.interface_focus_events enable row level security;
alter table public.interface_students enable row level security;
alter table public.interface_submissions enable row level security;
alter table public.interface_limits enable row level security;
alter table public.interface_schema_migrations enable row level security;
revoke all on public.interface_settings,public.interface_classes,public.interface_subjects,public.interface_class_subjects,public.interface_question_banks,public.interface_questions,public.interface_simulations,public.interface_simulation_attempts,public.interface_xp_events,public.interface_championships,public.interface_championship_participants,public.interface_duel_matches,public.interface_duel_attempts,public.interface_focus_events,public.interface_students,public.interface_submissions,public.interface_limits,public.interface_schema_migrations from anon,authenticated;
grant all on public.interface_settings,public.interface_classes,public.interface_subjects,public.interface_class_subjects,public.interface_question_banks,public.interface_questions,public.interface_simulations,public.interface_simulation_attempts,public.interface_xp_events,public.interface_championships,public.interface_championship_participants,public.interface_duel_matches,public.interface_duel_attempts,public.interface_focus_events,public.interface_students,public.interface_submissions,public.interface_limits,public.interface_schema_migrations to service_role;
revoke all on function public.interface_take_limit(text,integer) from public,anon,authenticated;
grant execute on function public.interface_take_limit(text,integer) to service_role;
