create table if not exists public.baba_results (
 id bigint generated always as identity primary key,
 session_id uuid not null,
 event_type text not null check (event_type in ('quiz','verdict')),
 quiz_score int check (quiz_score between 0 and 5),
 time_seconds int check (time_seconds between 0 and 300),
 answers jsonb,
 verdict text check (verdict in ('yes','no','discuss')),
 created_at timestamptz not null default now(),
 constraint valid_event check (
  (event_type='quiz' and quiz_score is not null and time_seconds is not null and verdict is null and jsonb_typeof(answers)='array' and jsonb_array_length(answers)=5)
  or (event_type='verdict' and verdict is not null and quiz_score is null and answers is null)
 )
);
alter table public.baba_results enable row level security;
revoke all on public.baba_results from anon, authenticated;
grant insert on public.baba_results to anon;
grant usage, select on sequence public.baba_results_id_seq to anon;
create policy "Anyone can submit, nobody can browse" on public.baba_results for insert to anon with check (true);