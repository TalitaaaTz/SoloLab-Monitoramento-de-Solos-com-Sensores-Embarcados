/**
 * Página: Histórico de leituras.
 * Permite filtrar por período e dispositivo, exibir tabela paginada e
 * exportar CSV.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EstadoVazio } from "@/componentes/EstadoVazio";
import { TabelaLeituras } from "@/componentes/TabelaLeituras";
import {
  buscarHistoricoLeituras,
  listarDispositivos,
} from "@/servicos/leiturasServico";
import type { JanelaTempo } from "@/tipos/dominio";
import { INTERVALO_ATUALIZACAO_AUTOMATICA_MS } from "@/utilitarios/constantes";
import { exportarLeiturasParaCsv } from "@/utilitarios/exportarCsv";

const TAMANHO_PAGINA = 25;

const OPCOES_JANELA: Array<{ valor: JanelaTempo; rotulo: string }> = [
  { valor: "6h", rotulo: "Últimas 6 horas" },
  { valor: "24h", rotulo: "Últimas 24 horas" },
  { valor: "7d", rotulo: "Últimos 7 dias" },
  { valor: "personalizado", rotulo: "Período personalizado" },
];

function calcularIntervalo(
  janela: JanelaTempo,
  inicioPersonalizado: string,
  fimPersonalizado: string,
): { inicio?: string; fim?: string } {
  const agora = Date.now();
  switch (janela) {
    case "6h":
      return { inicio: new Date(agora - 6 * 60 * 60 * 1000).toISOString() };
    case "24h":
      return { inicio: new Date(agora - 24 * 60 * 60 * 1000).toISOString() };
    case "7d":
      return { inicio: new Date(agora - 7 * 24 * 60 * 60 * 1000).toISOString() };
    case "personalizado":
      return {
        inicio: inicioPersonalizado ? new Date(inicioPersonalizado).toISOString() : undefined,
        fim: fimPersonalizado ? new Date(fimPersonalizado).toISOString() : undefined,
      };
  }
}

export function PaginaHistorico() {
  const [janela, setJanela] = useState<JanelaTempo>("24h");
  const [dispositivoSelecionado, setDispositivoSelecionado] = useState<string>("");
  const [inicioPersonalizado, setInicioPersonalizado] = useState("");
  const [fimPersonalizado, setFimPersonalizado] = useState("");
  const [pagina, setPagina] = useState(1);

  const dispositivosConsulta = useQuery({
    queryKey: ["dispositivos"],
    queryFn: listarDispositivos,
  });

  const intervalo = useMemo(
    () => calcularIntervalo(janela, inicioPersonalizado, fimPersonalizado),
    [janela, inicioPersonalizado, fimPersonalizado],
  );

  const historicoConsulta = useQuery({
    queryKey: [
      "leituras-solo",
      "historico",
      intervalo.inicio,
      intervalo.fim,
      dispositivoSelecionado,
    ],
    queryFn: () =>
      buscarHistoricoLeituras({
        inicio: intervalo.inicio,
        fim: intervalo.fim,
        dispositivoId: dispositivoSelecionado || undefined,
        limite: 2000,
      }),
    refetchInterval: INTERVALO_ATUALIZACAO_AUTOMATICA_MS,
  });

  const leiturasOrdenadas = useMemo(() => {
    const lista = historicoConsulta.data ?? [];
    return [...lista].reverse();
  }, [historicoConsulta.data]);

  const totalPaginas = Math.max(1, Math.ceil(leiturasOrdenadas.length / TAMANHO_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const leiturasPagina = useMemo(
    () =>
      leiturasOrdenadas.slice(
        (paginaAtual - 1) * TAMANHO_PAGINA,
        paginaAtual * TAMANHO_PAGINA,
      ),
    [leiturasOrdenadas, paginaAtual],
  );

  return (
    <section className="pilha-paginas">
      <header className="cabecalho-pagina">
        <div>
          <p className="rotulo-tecnico">Histórico</p>
          <h2 style={{ margin: "0.15rem 0 0" }}>Consulta de leituras válidas</h2>
        </div>
        <button
          type="button"
          className="botao-tecnico"
          onClick={() =>
            exportarLeiturasParaCsv(leiturasOrdenadas, "historico_leituras.csv")
          }
          disabled={leiturasOrdenadas.length === 0}
        >
          Exportar CSV
        </button>
      </header>

      <section aria-label="Filtros" className="cartao filtros-historico">
        <label className="campo-filtro">
          <span className="rotulo-tecnico">Período</span>
          <select
            className="botao-tecnico"
            value={janela}
            onChange={(evento) => {
              setJanela(evento.target.value as JanelaTempo);
              setPagina(1);
            }}
          >
            {OPCOES_JANELA.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="campo-filtro">
          <span className="rotulo-tecnico">Dispositivo</span>
          <select
            className="botao-tecnico"
            value={dispositivoSelecionado}
            onChange={(evento) => {
              setDispositivoSelecionado(evento.target.value);
              setPagina(1);
            }}
          >
            <option value="">Todos</option>
            {(dispositivosConsulta.data ?? []).map((dispositivo) => (
              <option key={dispositivo} value={dispositivo}>
                {dispositivo}
              </option>
            ))}
          </select>
        </label>

        {janela === "personalizado" ? (
          <>
            <label className="campo-filtro">
              <span className="rotulo-tecnico">Início</span>
              <input
                type="datetime-local"
                className="botao-tecnico"
                value={inicioPersonalizado}
                onChange={(evento) => {
                  setInicioPersonalizado(evento.target.value);
                  setPagina(1);
                }}
              />
            </label>
            <label className="campo-filtro">
              <span className="rotulo-tecnico">Fim</span>
              <input
                type="datetime-local"
                className="botao-tecnico"
                value={fimPersonalizado}
                onChange={(evento) => {
                  setFimPersonalizado(evento.target.value);
                  setPagina(1);
                }}
              />
            </label>
          </>
        ) : null}
      </section>

      {historicoConsulta.isError ? (
        <p role="alert" className="mensagem-erro">
          Erro ao carregar o histórico:{" "}
          {historicoConsulta.error instanceof Error
            ? historicoConsulta.error.message
            : "erro desconhecido"}
          .
        </p>
      ) : null}

      <section aria-label="Tabela de leituras" className="cartao bloco-tabela">
        {historicoConsulta.isLoading ? (
          <p style={{ color: "var(--color-muted-foreground)" }}>Carregando leituras…</p>
        ) : leiturasPagina.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma leitura no período selecionado"
            descricao="Ajuste os filtros ou aguarde novos envios do ESP32."
          />
        ) : (
          <>
            <TabelaLeituras
              leituras={leiturasPagina}
              legenda={`${leiturasOrdenadas.length} leituras encontradas — página ${paginaAtual} de ${totalPaginas}`}
            />
            <nav aria-label="Paginação" className="paginacao">
              <button
                type="button"
                className="botao-tecnico"
                onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
                disabled={paginaAtual === 1}
              >
                Anterior
              </button>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                {paginaAtual} / {totalPaginas}
              </span>
              <button
                type="button"
                className="botao-tecnico"
                onClick={() =>
                  setPagina((atual) => Math.min(totalPaginas, atual + 1))
                }
                disabled={paginaAtual === totalPaginas}
              >
                Próxima
              </button>
            </nav>
          </>
        )}
      </section>
    </section>
  );
}
