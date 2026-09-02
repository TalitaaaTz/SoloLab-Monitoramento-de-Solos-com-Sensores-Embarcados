/**
 * Tabela semântica de leituras. Exibe as colunas relevantes do laboratório
 * com formatação consistente. Não realiza paginação — o componente pai
 * decide quantas linhas passar.
 */

import type { LeituraSolo } from "@/tipos/dominio";
import { formatarDataHora, formatarValorBruto } from "@/utilitarios/formatadores";

interface PropriedadesTabela {
  leituras: LeituraSolo[];
  legenda?: string;
}

export function TabelaLeituras({ leituras, legenda }: PropriedadesTabela) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        {legenda ? <caption style={{ captionSide: "top", textAlign: "left", padding: "0.25rem 0", fontSize: "0.8rem", color: "var(--color-muted-foreground)" }}>{legenda}</caption> : null}
        <thead>
          <tr>
            <th>Data/Hora</th>
            <th>Dispositivo</th>
            <th>Temperatura</th>
            <th>Umidade</th>
            <th>Condutividade</th>
            <th>Analógico</th>
            <th>Amostras</th>
          </tr>
        </thead>
        <tbody>
          {leituras.map((l) => (
            <tr key={l.id}>
              <td style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                {formatarDataHora(l.coletado_em)}
              </td>
              <td>{l.dispositivo_id}</td>
              <td>{formatarValorBruto(l.temperatura_thcs_bruta)}</td>
              <td>{formatarValorBruto(l.umidade_thcs_bruta)}</td>
              <td>{formatarValorBruto(l.condutividade_thcs_bruta)}</td>
              <td>{formatarValorBruto(l.solo_analogico_bruto)}</td>
              <td>{l.quantidade_amostras ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
