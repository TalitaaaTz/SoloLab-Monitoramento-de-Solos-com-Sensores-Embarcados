/**
 * Serviço de leituras de solo.
 *
 * Todas as funções consultam o Supabase diretamente do navegador
 * usando a chave pública (anon). As políticas de RLS garantem que
 * apenas leituras com status_leitura = 'valida' fiquem visíveis.
 */

import { supabase } from "@/integracoes/supabase/cliente";
import type { LeituraSolo } from "@/tipos/dominio";

const COLUNAS_LEITURA =
  "id, dispositivo_id, coletado_em, temperatura_thcs_bruta, umidade_thcs_bruta, condutividade_thcs_bruta, solo_analogico_bruto, quantidade_amostras, intervalo_amostra_ms, status_leitura, observacao";

/** Busca a última leitura válida disponível. */
export async function buscarUltimaLeituraValida(): Promise<LeituraSolo | null> {
  const { data, error } = await supabase
    .from("leituras_solo")
    .select(COLUNAS_LEITURA)
    .eq("status_leitura", "valida")
    .order("coletado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Não foi possível buscar a última leitura: ${error.message}`);
  }
  return (data as LeituraSolo | null) ?? null;
}

interface FiltrosHistorico {
  inicio?: string; // ISO
  fim?: string; // ISO
  dispositivoId?: string;
  limite?: number;
}

/** Busca leituras válidas dentro de um período. */
export async function buscarHistoricoLeituras(
  filtros: FiltrosHistorico = {},
): Promise<LeituraSolo[]> {
  let consulta = supabase
    .from("leituras_solo")
    .select(COLUNAS_LEITURA)
    .eq("status_leitura", "valida")
    .order("coletado_em", { ascending: true });

  if (filtros.inicio) consulta = consulta.gte("coletado_em", filtros.inicio);
  if (filtros.fim) consulta = consulta.lte("coletado_em", filtros.fim);
  if (filtros.dispositivoId)
    consulta = consulta.eq("dispositivo_id", filtros.dispositivoId);
  if (filtros.limite) consulta = consulta.limit(filtros.limite);

  const { data, error } = await consulta;
  if (error) {
    throw new Error(`Não foi possível buscar o histórico: ${error.message}`);
  }
  return (data as LeituraSolo[] | null) ?? [];
}

/** Lista os dispositivos distintos que enviaram leituras válidas. */
export async function listarDispositivos(): Promise<string[]> {
  const { data, error } = await supabase
    .from("leituras_solo")
    .select("dispositivo_id")
    .eq("status_leitura", "valida")
    .order("dispositivo_id", { ascending: true })
    .limit(500);

  if (error) {
    throw new Error(`Não foi possível listar dispositivos: ${error.message}`);
  }
  const conjunto = new Set<string>();
  for (const linha of (data as Array<{ dispositivo_id: string }> | null) ?? []) {
    if (linha.dispositivo_id) conjunto.add(linha.dispositivo_id);
  }
  return Array.from(conjunto);
}
