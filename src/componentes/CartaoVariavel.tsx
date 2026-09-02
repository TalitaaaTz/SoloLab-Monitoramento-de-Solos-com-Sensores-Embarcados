/**
 * Cartão compacto que apresenta uma variável bruta da última leitura.
 */

import { formatarDataHora, formatarValorBruto } from "@/utilitarios/formatadores";

interface PropriedadesCartaoVariavel {
  titulo: string;
  descricao: string;
  unidade: string;
  tom: "agua" | "vegetacao" | "terra" | "grafite";
  valor: number | null | undefined;
  coletadoEm: string | null | undefined;
  dispositivoId: string | null | undefined;
}

const estilosPorTom = {
  agua: {
    fundo: "var(--color-card-agua)",
    borda: "var(--color-accent-agua)",
    destaque: "var(--color-accent-agua)",
  },
  vegetacao: {
    fundo: "var(--color-card-vegetacao)",
    borda: "var(--color-accent-vegetacao)",
    destaque: "var(--color-accent-vegetacao)",
  },
  terra: {
    fundo: "var(--color-card-terra)",
    borda: "var(--color-accent-terra)",
    destaque: "var(--color-accent-terra)",
  },
  grafite: {
    fundo: "var(--color-card-grafite)",
    borda: "var(--color-primary)",
    destaque: "var(--color-primary)",
  },
};

function formatarMedicao(valor: number | null | undefined, unidade: string) {
  const valorFormatado = formatarValorBruto(valor);
  if (valorFormatado === "—") return valorFormatado;
  return `${valorFormatado} ${unidade}`;
}

export function CartaoVariavel({
  titulo,
  descricao,
  unidade,
  tom,
  valor,
  coletadoEm,
  dispositivoId,
}: PropriedadesCartaoVariavel) {
  const estilos = estilosPorTom[tom];

  return (
    <article
      className="cartao cartao-variavel"
      aria-label={titulo}
      style={{
        background: estilos.fundo,
        borderColor: estilos.borda,
        borderLeftWidth: "5px",
      }}
    >
      <span
        className="rotulo-tecnico etiqueta-leitura"
        style={{ color: estilos.destaque, borderColor: estilos.borda }}
      >
        leitura
      </span>
      <header className="cabecalho-cartao-variavel">
        <h3 className="rotulo-tecnico" style={{ margin: 0, color: "var(--color-foreground)" }}>
          {titulo}
        </h3>
      </header>
      <div className="corpo-cartao-variavel">
        <p className="valor-tecnico" style={{ margin: 0, color: estilos.destaque }}>
          {formatarMedicao(valor, unidade)}
        </p>
        <p className="descricao-cartao">{descricao}</p>
      </div>
      <footer className="rodape-cartao-variavel">
        <span>
          {coletadoEm
            ? `${formatarDataHora(coletadoEm)}${dispositivoId ? ` · ${dispositivoId}` : ""}`
            : "Aguardando leitura do sensor"}
        </span>
      </footer>
    </article>
  );
}
