
-- Tabela de leituras brutas vindas do ESP32
CREATE TABLE public.leituras_solo (
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

CREATE INDEX idx_leituras_solo_coletado_em ON public.leituras_solo (coletado_em DESC);
CREATE INDEX idx_leituras_solo_dispositivo ON public.leituras_solo (dispositivo_id);

GRANT SELECT ON public.leituras_solo TO anon;
GRANT SELECT ON public.leituras_solo TO authenticated;
GRANT ALL ON public.leituras_solo TO service_role;

ALTER TABLE public.leituras_solo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leituras de solo podem ser lidas publicamente"
  ON public.leituras_solo FOR SELECT
  USING (true);

-- Tabela de análises geradas por inteligência artificial
CREATE TABLE public.analises_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispositivo_id TEXT,
  periodo_inicial TIMESTAMPTZ NOT NULL,
  periodo_final TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  quantidade_leituras_analisadas INTEGER NOT NULL DEFAULT 0,
  resumo_analise TEXT NOT NULL,
  observacoes TEXT,
  status_calibracao TEXT NOT NULL DEFAULT 'em_calibracao'
);

CREATE INDEX idx_analises_ia_criado_em ON public.analises_ia (criado_em DESC);

GRANT SELECT ON public.analises_ia TO anon;
GRANT SELECT ON public.analises_ia TO authenticated;
GRANT ALL ON public.analises_ia TO service_role;

ALTER TABLE public.analises_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analises de IA podem ser lidas publicamente"
  ON public.analises_ia FOR SELECT
  USING (true);
