/**
 * Constantes centralizadas do dashboard.
 */

import type { VariavelMonitorada } from "@/tipos/dominio";

/**
 * Tempo máximo (em milissegundos) sem novas leituras antes do dashboard
 * considerar que o ESP32 está "sem atualização recente".
 *
 * Como o firmware envia uma média a cada ~1 minuto, usamos 5 minutos
 * como margem de tolerância para variações de rede.
 */
export const LIMITE_ATUALIZACAO_RECENTE_MS = 5 * 60 * 1000;

/**
 * Aviso fixo do chatbot.
 */
export const AVISO_CHATBOT =
  "As respostas possuem caráter auxiliar e não substituem a calibração dos sensores, a avaliação técnica ou a interpretação científica dos dados.";

/**
 * Aviso de calibração exibido no cabeçalho global.
 */
export const AVISO_CALIBRACAO =
  "Dados em fase de calibração laboratorial. Os valores apresentados são leituras brutas dos sensores.";

/**
 * Intervalo de atualização automática de segurança.
 * O painel também escuta eventos em tempo real; este intervalo cobre casos
 * em que o realtime do banco esteja indisponível no momento.
 */
export const INTERVALO_ATUALIZACAO_AUTOMATICA_MS = 5 * 1000;

/**
 * Rótulos legíveis em português para cada variável monitorada.
 */
export const ROTULOS_VARIAVEIS: Record<
  VariavelMonitorada,
  {
    titulo: string;
    descricao: string;
    unidade: string;
    tom: "agua" | "vegetacao" | "terra" | "grafite";
  }
> = {
  temperatura_thcs_bruta: {
    titulo: "Temperatura",
    descricao: "Sensor THC-S via RS485",
    unidade: "°C",
    tom: "agua",
  },
  umidade_thcs_bruta: {
    titulo: "Umidade do solo",
    descricao: "Estimativa do sensor THC-S",
    unidade: "%",
    tom: "vegetacao",
  },
  condutividade_thcs_bruta: {
    titulo: "Condutividade",
    descricao: "Sais dissolvidos no solo",
    unidade: "µS/cm",
    tom: "terra",
  },
  solo_analogico_bruto: {
    titulo: "Leitura analógica",
    descricao: "Sinal elétrico auxiliar do solo",
    unidade: "ADC",
    tom: "grafite",
  },
};

export const VARIAVEIS_DISPONIVEIS: VariavelMonitorada[] = [
  "temperatura_thcs_bruta",
  "umidade_thcs_bruta",
  "condutividade_thcs_bruta",
  "solo_analogico_bruto",
];

/**
 * Valores padrão exibidos nos cartões enquanto o ESP32 ainda não enviou
 * leituras. Servem apenas como referência visual de amostra.
 */
export const VALORES_EXEMPLO: Record<VariavelMonitorada, number> = {
  temperatura_thcs_bruta: 24.5,
  umidade_thcs_bruta: 38.2,
  condutividade_thcs_bruta: 412,
  solo_analogico_bruto: 2150,
};
