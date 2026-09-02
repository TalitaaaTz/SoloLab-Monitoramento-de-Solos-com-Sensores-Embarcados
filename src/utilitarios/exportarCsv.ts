/**
 * Gera um arquivo CSV a partir de uma lista de leituras e dispara o download
 * no navegador. Não envia dados para o servidor.
 */

import type { LeituraSolo } from "@/tipos/dominio";

const COLUNAS: Array<{ chave: keyof LeituraSolo; titulo: string }> = [
  { chave: "coletado_em", titulo: "coletado_em" },
  { chave: "dispositivo_id", titulo: "dispositivo_id" },
  { chave: "temperatura_thcs_bruta", titulo: "temperatura_thcs_bruta" },
  { chave: "umidade_thcs_bruta", titulo: "umidade_thcs_bruta" },
  { chave: "condutividade_thcs_bruta", titulo: "condutividade_thcs_bruta" },
  { chave: "solo_analogico_bruto", titulo: "solo_analogico_bruto" },
  { chave: "quantidade_amostras", titulo: "quantidade_amostras" },
  { chave: "intervalo_amostra_ms", titulo: "intervalo_amostra_ms" },
  { chave: "status_leitura", titulo: "status_leitura" },
  { chave: "observacao", titulo: "observacao" },
];

function escaparCampoCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  if (/[",\n;]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function exportarLeiturasParaCsv(
  leituras: LeituraSolo[],
  nomeArquivo = "leituras_solo.csv",
): void {
  const cabecalho = COLUNAS.map((c) => c.titulo).join(",");
  const linhas = leituras.map((leitura) =>
    COLUNAS.map((c) => escaparCampoCsv(leitura[c.chave])).join(","),
  );
  const conteudo = [cabecalho, ...linhas].join("\n");

  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
