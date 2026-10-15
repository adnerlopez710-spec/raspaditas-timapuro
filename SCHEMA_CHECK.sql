-- Raspaditas Timapuro: consulta de solo lectura para cotejar el esquema real.
-- No modifica ni elimina tablas o datos.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'prizes', 'sellers', 'sales', 'tickets',
    'prize_claims', 'audit_log'
  )
ORDER BY table_name, ordinal_position;
