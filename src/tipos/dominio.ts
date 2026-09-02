/**
 * Tipos de domínio do dashboard.
 * Os nomes refletem exatamente as colunas da tabela `leituras_solo`.
 */

export interface LeituraSolo {
  id: string;
  dispositivo_id: string;
  coletado_em: string; // ISO 8601
  temperatura_thcs_bruta: number | null;
  umidade_thcs_bruta: number | null;
  condutividade_thcs_bruta: number | null;
  solo_analogico_bruto: number | null;
  quantidade_amostras: number | null;
  intervalo_amostra_ms: number | null;
  status_leitura: string;
  observacao: string | null;
}

/** Variáveis exibidas no gráfico e nos filtros. */
export type VariavelMonitorada =
  | "temperatura_thcs_bruta"
  | "umidade_thcs_bruta"
  | "condutividade_thcs_bruta"
  | "solo_analogico_bruto";

/** Janelas de tempo pré-definidas. */
export type JanelaTempo = "6h" | "24h" | "7d" | "personalizado";

/** Mensagem trocada com o assistente. */
export interface MensagemChat {
  id: string;
  papel: "usuario" | "assistente";
  conteudo: string;
}
