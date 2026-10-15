-- Raspaditas Timapuro — carga inicial de los 13 resultados aprobados.
-- Ejecutar en Supabase SQL Editor. No elimina registros existentes.
-- Si el premio ya existe con el mismo nombre, actualiza importe/probabilidad y lo activa.
BEGIN;

CREATE TEMP TABLE timapuro_premios_iniciales (
  name text PRIMARY KEY,
  amount_gs bigint NOT NULL,
  probability_percent numeric(12,8) NOT NULL
) ON COMMIT DROP;

INSERT INTO timapuro_premios_iniciales (name, amount_gs, probability_percent) VALUES
  ('Lata Kaiser', 5000, 5.00000),
  ('Lata Brahma', 10000, 1.00000),
  ('Lata Skol', 25000, 0.80000),
  ('Botellita Skol abre fácil', 50000, 0.10000),
  ('Botellita Budweiser', 100000, 0.05000),
  ('Heineken botellita', 250000, 0.01600),
  ('Stella Artois', 500000, 0.00600),
  ('Heineken Silver', 1000000, 0.00100),
  ('Johnnie Walker Gold Label', 3000000, 0.00020),
  ('SORPRESA PLATA', 0, 0.00030),
  ('Johnnie Walker Blue Label', 5000000, 0.00008),
  ('SORPRESA GOLD', 0, 0.00010),
  ('SIN PREMIO — Cerveza Polar', 0, 93.02632);

UPDATE public.prizes AS p
SET amount_gs = s.amount_gs,
    probability_percent = s.probability_percent,
    active = true
FROM timapuro_premios_iniciales AS s
WHERE lower(trim(p.name)) = lower(trim(s.name));

INSERT INTO public.prizes (name, amount_gs, probability_percent, active)
SELECT s.name, s.amount_gs, s.probability_percent, true
FROM timapuro_premios_iniciales AS s
WHERE NOT EXISTS (
  SELECT 1 FROM public.prizes AS p
  WHERE lower(trim(p.name)) = lower(trim(s.name))
);

-- Debe devolver 100.00000. La consulta no modifica datos.
SELECT round(sum(probability_percent), 5) AS total_probabilidad_porcentaje
FROM public.prizes
WHERE name IN (SELECT name FROM timapuro_premios_iniciales);

COMMIT;
