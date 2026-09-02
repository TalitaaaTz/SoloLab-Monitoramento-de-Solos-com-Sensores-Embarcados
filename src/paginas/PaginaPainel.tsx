/**
 * Página: Painel principal.
 * Mostra o status de atualização, quatro cartões com as variáveis brutas,
 * o gráfico histórico do dia e a tabela de leituras recentes.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CartaoVariavel } from "@/componentes/CartaoVariavel";
import { EstadoVazio } from "@/componentes/EstadoVazio";
import { GraficoHistorico } from "@/componentes/GraficoHistorico";
import { TabelaLeituras } from "@/componentes/TabelaLeituras";
import {
  buscarHistoricoLeituras,
  buscarUltimaLeituraValida,
} from "@/servicos/leiturasServico";
import type { VariavelMonitorada } from "@/tipos/dominio";
import {
  INTERVALO_ATUALIZACAO_AUTOMATICA_MS,
  ROTULOS_VARIAVEIS,
  VALORES_EXEMPLO,
  VARIAVEIS_DISPONIVEIS,
} from "@/utilitarios/constantes";
import { exportarLeiturasParaCsv } from "@/utilitarios/exportarCsv";
import {
  formatarDataHora,
  verificarAtualizacaoRecente,
} from "@/utilitarios/formatadores";

const ROTULO_STATUS = {
  atualizado: "Atualizado recentemente",
  sem_atualizacao_recente: "Sem atualização recente",
  sem_dados: "Nenhuma leitura recebida",
} as const;

export function PaginaPainel() {
  const [variavelGrafico, setVariavelGrafico] =
    useState<VariavelMonitorada>("temperatura_thcs_bruta");

  const ultimaLeitura = useQuery({
    queryKey: ["leituras-solo", "ultima"],
    queryFn: buscarUltimaLeituraValida,
    refetchInterval: INTERVALO_ATUALIZACAO_AUTOMATICA_MS,
  });

  const historico24h = useQuery({
    queryKey: ["leituras-solo", "historico-24h"],
    queryFn: () =>
      buscarHistoricoLeituras({
        inicio: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        limite: 500,
      }),
    refetchInterval: INTERVALO_ATUALIZACAO_AUTOMATICA_MS,
  });

  const leiturasRecentes = useMemo(() => {
    const lista = historico24h.data ?? [];
    return [...lista].reverse().slice(0, 10);
  }, [historico24h.data]);

  const status = verificarAtualizacaoRecente(ultimaLeitura.data?.coletado_em);
  const carregandoGlobal = ultimaLeitura.isFetching || historico24h.isFetching;

  function atualizarTudo() {
    ultimaLeitura.refetch();
    historico24h.refetch();
  }

  return (
    <section className="pilha-paginas">
      <header className="cabecalho-pagina">
        <div>
          <p className="rotulo-tecnico">Painel principal</p>
          <h2 style={{ margin: "0.15rem 0 0.35rem" }}>
            Sistema embarcado para acompanhamento experimental de solo
          </h2>
          <p style={{ margin: 0, color: "var(--color-muted-foreground)", fontSize: "0.88rem" }}>
            Última leitura registrada: {formatarDataHora(ultimaLeitura.data?.coletado_em)}
          </p>
        </div>
        <button
          type="button"
          onClick={atualizarTudo}
          className="botao-tecnico-primario"
          disabled={carregandoGlobal}
        >
          {carregandoGlobal ? "Atualizando…" : "Atualizar agora"}
        </button>
      </header>

      <p
        role="status"
        className={`indicador-status indicador-${status}`}
        aria-live="polite"
      >
        {ROTULO_STATUS[status]}
      </p>

      {ultimaLeitura.isError ? (
        <p role="alert" className="mensagem-erro">
          Erro ao buscar a última leitura:{" "}
          {ultimaLeitura.error instanceof Error
            ? ultimaLeitura.error.message
            : "erro desconhecido"}
          .
        </p>
      ) : null}

      <section aria-label="Variáveis monitoradas" className="grade-cartoes">
        {VARIAVEIS_DISPONIVEIS.map((variavel) => {
          const rotulo = ROTULOS_VARIAVEIS[variavel];
          const valorReal = ultimaLeitura.data?.[variavel] ?? null;
          const valor =
            valorReal === null || valorReal === undefined
              ? VALORES_EXEMPLO[variavel]
              : valorReal;
          return (
            <CartaoVariavel
              key={variavel}
              titulo={rotulo.titulo}
              descricao={rotulo.descricao}
              unidade={rotulo.unidade}
              tom={rotulo.tom}
              valor={valor}
              coletadoEm={ultimaLeitura.data?.coletado_em ?? null}
              dispositivoId={ultimaLeitura.data?.dispositivo_id ?? null}
            />
          );
        })}
      </section>

      <section aria-label="Gráfico histórico" className="cartao bloco-grafico">
        <header className="cabecalho-bloco">
          <div>
            <p className="rotulo-tecnico">Gráfico — últimas 24 horas</p>
            <h3 style={{ margin: "0.1rem 0 0" }}>{ROTULOS_VARIAVEIS[variavelGrafico].titulo}</h3>
          </div>
          <label className="seletor-variavel">
            <span className="sr-only">Selecionar variável do gráfico</span>
            <select
              value={variavelGrafico}
              onChange={(evento) =>
                setVariavelGrafico(evento.target.value as VariavelMonitorada)
              }
              className="botao-tecnico"
            >
              {VARIAVEIS_DISPONIVEIS.map((variavel) => (
                <option key={variavel} value={variavel}>
                  {ROTULOS_VARIAVEIS[variavel].titulo}
                </option>
              ))}
            </select>
          </label>
        </header>

        {historico24h.isLoading ? (
          <p style={{ color: "var(--color-muted-foreground)" }}>Carregando histórico…</p>
        ) : (historico24h.data ?? []).length === 0 ? (
          <EstadoVazio
            titulo="Sem dados nas últimas 24 horas"
            descricao="O gráfico será exibido assim que houver leituras válidas no período."
          />
        ) : (
          <GraficoHistorico
            leituras={historico24h.data ?? []}
            variavel={variavelGrafico}
          />
        )}
      </section>

      <section aria-label="Leituras recentes" className="cartao bloco-tabela">
        <header className="cabecalho-bloco">
          <div>
            <p className="rotulo-tecnico">Leituras recentes</p>
            <h3 style={{ margin: "0.1rem 0 0" }}>Últimas 10 amostras válidas</h3>
          </div>
          <button
            type="button"
            className="botao-tecnico"
            onClick={() => exportarLeiturasParaCsv(leiturasRecentes)}
            disabled={leiturasRecentes.length === 0}
          >
            Exportar CSV
          </button>
        </header>

        {leiturasRecentes.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma leitura recebida ainda"
            descricao="Verifique se o ESP32 está conectado e configurado para enviar dados ao banco."
          />
        ) : (
          <TabelaLeituras leituras={leiturasRecentes} />
        )}
      </section>
    </section>
  );
}
