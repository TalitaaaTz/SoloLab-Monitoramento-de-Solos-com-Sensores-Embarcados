/**
 * Funções utilitárias para formatação de datas e números.
 * Mantidas separadas dos componentes para facilitar testes e reutilização.
 */

import { LIMITE_ATUALIZACAO_RECENTE_MS } from "./constantes";

/** Formata uma data ISO para "dd/mm/aaaa hh:mm:ss" no fuso local. */
export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "Nenhuma leitura ainda";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "Data inválida";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Formata um número bruto para exibição. Mantém precisão moderada. */
export function formatarValorBruto(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Indica se a última leitura recebida está dentro da janela considerada
 * "atualização recente". Retorna `null` quando não há leitura nenhuma.
 */
export function verificarAtualizacaoRecente(
  coletadoEm: string | null | undefined,
): "atualizado" | "sem_atualizacao_recente" | "sem_dados" {
  if (!coletadoEm) return "sem_dados";
  const data = new Date(coletadoEm);
  if (Number.isNaN(data.getTime())) return "sem_dados";
  const diferenca = Date.now() - data.getTime();
  return diferenca <= LIMITE_ATUALIZACAO_RECENTE_MS
    ? "atualizado"
    : "sem_atualizacao_recente";
}
