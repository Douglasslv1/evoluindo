-- Execute no SQL Editor do Supabase depois de database/schema.sql.
-- Esta verificação é somente leitura e não exibe dados de alunos.
with expected(name) as (values
  ('interface_settings'),('interface_classes'),('interface_students'),('interface_subjects'),('interface_lessons'),('interface_class_lessons'),
  ('interface_class_subjects'),('interface_question_banks'),('interface_questions'),
  ('interface_simulations'),('interface_simulation_attempts'),('interface_xp_events'),
  ('interface_championships'),('interface_championship_participants'),('interface_duel_matches'),
  ('interface_duel_attempts'),('interface_focus_events'),('interface_submissions'),
  ('interface_limits'),('interface_schema_migrations')
)
select e.name as missing_table
from expected e
left join information_schema.tables t on t.table_schema='public' and t.table_name=e.name
where t.table_name is null;

select tablename, rowsecurity
from pg_tables
where schemaname='public' and tablename like 'interface_%'
order by tablename;

select id, applied_at
from public.interface_schema_migrations
order by applied_at;

select 'interface_subjects.system_key' as missing_column
where not exists (
  select 1 from information_schema.columns
  where table_schema='public' and table_name='interface_subjects' and column_name='system_key'
);
