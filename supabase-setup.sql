-- =====================================================================
-- SoloLab — Esquema do Supabase
-- =====================================================================
-- Como usar:
--   1. Crie um projeto em https://supabase.com
--   2. Abra "SQL Editor" → "New query"
--   3. Cole TODO o conteúdo deste arquivo e clique em "Run"
--   4. Em "Project Settings" → "API" copie:
--        - Project URL          → VITE_SUPABASE_URL
--        - anon public key      → VITE_SUPABASE_PUBLISHABLE_KEY
--   5. Preencha o arquivo .env (use .env.example como modelo)
-- =====================================================================

-- Tabela de leituras brutas enviadas pelo ESP32
CREATE TABLE IF NOT EXISTS public.leituras_solo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispositivo_id TEXT NOT NULL,
  coletado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  temperatura_thcs_bruta NUMERIC,
  umidade_thcs_bruta NUMERIC,
  condutividade_thcs_bruta NUMERIC,
  solo_analogico_bruto NUMERIC,
  quantidade_amostras INTEGER,
  intervalo_amostra_ms INTEGER,
  status_leitura TEXT NOT NULL DEFAULT 'valida',
  observacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leituras_solo_coletado_em
  ON public.leituras_solo (coletado_em DESC);
CREATE INDEX IF NOT EXISTS idx_leituras_solo_dispositivo
  ON public.leituras_solo (dispositivo_id);

GRANT SELECT, INSERT ON public.leituras_solo TO anon;
GRANT SELECT, INSERT ON public.leituras_solo TO authenticated;
GRANT ALL ON public.leituras_solo TO service_role;

ALTER TABLE public.leituras_solo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura publica de leituras validas"
  ON public.leituras_solo;
CREATE POLICY "Leitura publica de leituras validas"
  ON public.leituras_solo
  FOR SELECT
  TO anon, authenticated
  USING (status_leitura = 'valida');

DROP POLICY IF EXISTS "Insercao pelo esp32 de laboratorio"
  ON public.leituras_solo;
CREATE POLICY "Insercao pelo esp32 de laboratorio"
  ON public.leituras_solo
  FOR INSERT
  TO anon
  WITH CHECK (
    dispositivo_id = 'esp32-lab-01'
    AND status_leitura = 'valida'
    AND quantidade_amostras BETWEEN 1 AND 100
    AND intervalo_amostra_ms BETWEEN 1000 AND 600000
  );

-- Tabela auxiliar para registros de análises geradas pelo assistente
CREATE TABLE IF NOT EXISTS public.analises_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispositivo_id TEXT,
  periodo_inicial TIMESTAMPTZ,
  periodo_final TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  resumo_analise TEXT NOT NULL,
  observacoes TEXT,
  status_calibracao TEXT NOT NULL DEFAULT 'em_calibracao'
);

GRANT SELECT ON public.analises_ia TO anon;
GRANT SELECT ON public.analises_ia TO authenticated;
GRANT ALL ON public.analises_ia TO service_role;

ALTER TABLE public.analises_ia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura publica das analises"
  ON public.analises_ia;
CREATE POLICY "Leitura publica das analises"
  ON public.analises_ia
  FOR SELECT
  TO anon, authenticated
  USING (true);
