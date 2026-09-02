/**
 * Gráfico de linha simples, desenhado em SVG puro, sem bibliotecas e
 * sem animações. Mantém o dashboard leve e adequado a celular.
 *
 * Os valores exibidos são SEMPRE brutos enquanto a calibração estiver
 * pendente — isto é declarado explicitamente abaixo do gráfico.
 */

import type { LeituraSolo, VariavelMonitorada } from "@/tipos/dominio";
import { ROTULOS_VARIAVEIS } from "@/utilitarios/constantes";
import { formatarDataHora, formatarValorBruto } from "@/utilitarios/formatadores";

interface PropriedadesGrafico {
  leituras: LeituraSolo[];
  variavel: VariavelMonitorada;
  modoExemplo?: boolean;
}

const LARGURA = 720;
const ALTURA = 280;
const MARGEM = { topo: 18, direita: 18, base: 34, esquerda: 58 };

export function GraficoHistorico({ leituras, variavel, modoExemplo = false }: PropriedadesGrafico) {
  const rotulo = ROTULOS_VARIAVEIS[variavel];
  const pontos = leituras
    .map((l) => ({ tempo: new Date(l.coletado_em).getTime(), valor: l[variavel] }))
    .filter((p): p is { tempo: number; valor: number } => typeof p.valor === "number");

  if (pontos.length < 2) {
    return (
      <figure className="cartao" style={{ margin: 0 }}>
        <figcaption className="rotulo-tecnico" style={{ marginBottom: "0.5rem" }}>
          {rotulo.titulo}
        </figcaption>
        <p style={{ margin: 0, color: "var(--color-muted-foreground)", fontSize: "0.85rem" }}>
          Dados insuficientes para traçar o gráfico no período selecionado.
        </p>
      </figure>
    );
  }

  const xMin = pontos[0]!.tempo;
  const xMax = pontos[pontos.length - 1]!.tempo;
  const valores = pontos.map((p) => p.valor);
  const yMin = Math.min(...valores);
  const yMax = Math.max(...valores);
  const intervaloY = yMax - yMin || 1;

  const larguraUtil = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const alturaUtil = ALTURA - MARGEM.topo - MARGEM.base;

  const escalarX = (t: number) =>
    MARGEM.esquerda + ((t - xMin) / (xMax - xMin || 1)) * larguraUtil;
  const escalarY = (v: number) =>
    MARGEM.topo + (1 - (v - yMin) / intervaloY) * alturaUtil;

  const caminho = pontos
    .map((p, i) => `${i === 0 ? "M" : "L"}${escalarX(p.tempo).toFixed(1)},${escalarY(p.valor).toFixed(1)}`)
    .join(" ");

  // Rótulos do eixo Y (mínimo, médio, máximo)
  const yMedio = (yMin + yMax) / 2;
  const rotulosY = [yMax, yMedio, yMin];

  return (
    <figure className="cartao" style={{ margin: 0 }}>
      <figcaption
        className="legenda-grafico"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.75rem",
          color: "var(--color-muted-foreground)",
          marginBottom: "0.4rem",
          flexWrap: "wrap",
        }}
      >
        <span className="rotulo-tecnico" style={{ flexShrink: 0 }}>
          {rotulo.titulo}
        </span>
        <span
          className="intervalo-grafico"
          style={{
            marginLeft: "auto",
            textAlign: "right",
            fontFamily: "var(--font-mono)",
            wordBreak: "break-word",
            minWidth: 0,
          }}
        >
          {pontos.length} pontos · {formatarDataHora(new Date(xMin).toISOString())} →{" "}
          {formatarDataHora(new Date(xMax).toISOString())}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        role="img"
        aria-label={`Gráfico de ${rotulo.titulo}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* Eixos */}
        <line
          x1={MARGEM.esquerda}
          y1={MARGEM.topo}
          x2={MARGEM.esquerda}
          y2={ALTURA - MARGEM.base}
          stroke="var(--color-border)"
        />
        <line
          x1={MARGEM.esquerda}
          y1={ALTURA - MARGEM.base}
          x2={LARGURA - MARGEM.direita}
          y2={ALTURA - MARGEM.base}
          stroke="var(--color-border)"
        />
        {/* Rótulos eixo Y */}
        {rotulosY.map((v, i) => (
          <g key={i}>
            <line
              x1={MARGEM.esquerda}
              y1={escalarY(v)}
              x2={LARGURA - MARGEM.direita}
              y2={escalarY(v)}
              stroke="var(--color-border)"
              strokeDasharray="2 4"
            />
            <text
              x={MARGEM.esquerda - 8}
              y={escalarY(v) + 5}
              textAnchor="end"
              fontSize="14"
              fill="var(--color-muted-foreground)"
              fontFamily="var(--font-mono)"
            >
              {formatarValorBruto(v)}
            </text>
          </g>
        ))}
        {/* Linha de dados */}
        <path d={caminho} fill="none" stroke="var(--color-accent-agua)" strokeWidth={2} />
      </svg>
    </figure>
  );
}
