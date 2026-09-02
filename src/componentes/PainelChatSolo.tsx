/**
 * Painel do chatbot científico do SoloLab.
 * Mantém histórico da sessão, envia contexto das leituras e renderiza
 * a resposta em Markdown (para negritos, listas, fórmulas e referências).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  buscarHistoricoLeituras,
  listarDispositivos,
} from "@/servicos/leiturasServico";
import { conversarComAssistente } from "@/servicos/chatServico";
import type { MensagemChat } from "@/tipos/dominio";
import { AVISO_CHATBOT } from "@/utilitarios/constantes";
import { formatarValorBruto } from "@/utilitarios/formatadores";

type Janela = "6h" | "24h" | "7d";

const OPCOES_JANELA: Array<{ valor: Janela; rotulo: string; horas: number }> = [
  { valor: "6h", rotulo: "Últimas 6 horas", horas: 6 },
  { valor: "24h", rotulo: "Últimas 24 horas", horas: 24 },
  { valor: "7d", rotulo: "Últimos 7 dias", horas: 24 * 7 },
];

const MENSAGEM_BOAS_VINDAS: MensagemChat = {
  id: "boas-vindas",
  papel: "assistente",
  conteudo:
    "**Assistente Científico do SoloLab** — UFRPE, Engenharia Agrícola e Ambiental. Interpreto conceitos físico-químicos do solo e as leituras brutas do sensor. Pergunte à vontade.",
};

function gerarResumo(
  dispositivoId: string,
  janelaHoras: number,
  leituras: Array<{
    temperatura_thcs_bruta: number | null;
    umidade_thcs_bruta: number | null;
    condutividade_thcs_bruta: number | null;
    solo_analogico_bruto: number | null;
  }>,
): string {
  if (leituras.length === 0) {
    return `Sem leituras válidas no dispositivo ${dispositivoId || "(qualquer)"} nas últimas ${janelaHoras}h.`;
  }
  const medias = {
    temperatura: 0,
    umidade: 0,
    condutividade: 0,
    analogico: 0,
  };
  let contagemTemperatura = 0;
  let contagemUmidade = 0;
  let contagemCondutividade = 0;
  let contagemAnalogico = 0;
  for (const leitura of leituras) {
    if (leitura.temperatura_thcs_bruta !== null) {
      medias.temperatura += leitura.temperatura_thcs_bruta;
      contagemTemperatura += 1;
    }
    if (leitura.umidade_thcs_bruta !== null) {
      medias.umidade += leitura.umidade_thcs_bruta;
      contagemUmidade += 1;
    }
    if (leitura.condutividade_thcs_bruta !== null) {
      medias.condutividade += leitura.condutividade_thcs_bruta;
      contagemCondutividade += 1;
    }
    if (leitura.solo_analogico_bruto !== null) {
      medias.analogico += leitura.solo_analogico_bruto;
      contagemAnalogico += 1;
    }
  }
  const m = (soma: number, n: number) =>
    n > 0 ? formatarValorBruto(soma / n) : "—";
  return [
    `Dispositivo: ${dispositivoId || "todos"}`,
    `Janela: últimas ${janelaHoras}h`,
    `Leituras válidas: ${leituras.length}`,
    `Médias brutas: temperatura ${m(medias.temperatura, contagemTemperatura)} °C; umidade ${m(medias.umidade, contagemUmidade)} %; condutividade ${m(medias.condutividade, contagemCondutividade)} µS/cm; analógico ${m(medias.analogico, contagemAnalogico)} ADC.`,
  ].join(" | ");
}

export function PainelChatSolo() {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([MENSAGEM_BOAS_VINDAS]);
  const [entrada, setEntrada] = useState("");
  const [dispositivoId, setDispositivoId] = useState("");
  const [janela, setJanela] = useState<Janela>("24h");
  const listaRef = useRef<HTMLUListElement | null>(null);

  const dispositivosConsulta = useQuery({
    queryKey: ["dispositivos"],
    queryFn: listarDispositivos,
  });

  const janelaSelecionada = useMemo(
    () => OPCOES_JANELA.find((o) => o.valor === janela) ?? OPCOES_JANELA[1]!,
    [janela],
  );

  const intervalo = useMemo(() => {
    const inicio = new Date(
      Date.now() - janelaSelecionada.horas * 60 * 60 * 1000,
    ).toISOString();
    const fim = new Date().toISOString();
    return { inicio, fim };
  }, [janelaSelecionada]);

  const leiturasContextoConsulta = useQuery({
    queryKey: ["leituras-chat", dispositivoId, intervalo.inicio],
    queryFn: () =>
      buscarHistoricoLeituras({
        inicio: intervalo.inicio,
        fim: intervalo.fim,
        dispositivoId: dispositivoId || undefined,
        limite: 500,
      }),
  });

  const mutacao = useMutation({
    mutationFn: async (texto: string) => {
      const resumo = gerarResumo(
        dispositivoId,
        janelaSelecionada.horas,
        leiturasContextoConsulta.data ?? [],
      );
      const historico = mensagens
        .filter((m) => m.id !== "boas-vindas")
        .map((m) => ({ papel: m.papel, conteudo: m.conteudo }));
      return conversarComAssistente({
        mensagem: texto,
        historico,
        dispositivoId: dispositivoId || undefined,
        periodoInicial: intervalo.inicio,
        periodoFinal: intervalo.fim,
        resumoLeituras: resumo,
      });
    },
    onSuccess: (resultado) => {
      setMensagens((atual) => [
        ...atual,
        {
          id: `ia-${Date.now()}`,
          papel: "assistente",
          conteudo: resultado.resposta,
        },
      ]);
    },
  });

  useEffect(() => {
    listaRef.current?.scrollTo({
      top: listaRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [mensagens, mutacao.isPending]);

  function enviar() {
    const texto = entrada.trim();
    if (!texto || mutacao.isPending) return;
    setMensagens((atual) => [
      ...atual,
      { id: `user-${Date.now()}`, papel: "usuario", conteudo: texto },
    ]);
    setEntrada("");
    mutacao.mutate(texto);
  }

  return (
    <article aria-label="Assistente do experimento" className="cartao painel-chat">
      <header className="cabecalho-chat">
        <div>
          <h3 style={{ margin: 0 }}>Conversa com o assistente</h3>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--color-muted-foreground)" }}>
            {AVISO_CHATBOT}
          </p>
        </div>
        {mensagens.length > 1 ? (
          <button
            type="button"
            className="botao-tecnico"
            onClick={() => {
              setMensagens([MENSAGEM_BOAS_VINDAS]);
              mutacao.reset();
            }}
            disabled={mutacao.isPending}
          >
            Limpar
          </button>
        ) : null}
      </header>

      <section aria-label="Contexto enviado ao assistente" className="contexto-chat">
        <label className="campo-filtro">
          <span className="rotulo-tecnico">Dispositivo</span>
          <select
            className="botao-tecnico"
            value={dispositivoId}
            onChange={(evento) => setDispositivoId(evento.target.value)}
          >
            <option value="">Todos</option>
            {(dispositivosConsulta.data ?? []).map((dispositivo) => (
              <option key={dispositivo} value={dispositivo}>
                {dispositivo}
              </option>
            ))}
          </select>
        </label>
        <label className="campo-filtro">
          <span className="rotulo-tecnico">Período</span>
          <select
            className="botao-tecnico"
            value={janela}
            onChange={(evento) => setJanela(evento.target.value as Janela)}
          >
            {OPCOES_JANELA.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </label>
      </section>

      <ul ref={listaRef} aria-live="polite" className="lista-mensagens">
        {mensagens.map((mensagem) => (
          <li
            key={mensagem.id}
            className={`mensagem mensagem-${mensagem.papel}`}
          >
            {mensagem.papel === "assistente" ? (
              <div className="markdown-corpo">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {mensagem.conteudo}
                </ReactMarkdown>
              </div>
            ) : (
              mensagem.conteudo
            )}
          </li>
        ))}
        {mutacao.isPending ? (
          <li className="mensagem mensagem-digitando">digitando…</li>
        ) : null}
      </ul>

      {mutacao.isError ? (
        <p role="alert" className="mensagem-erro">
          {mutacao.error instanceof Error
            ? mutacao.error.message
            : "Falha ao conversar com o assistente."}
        </p>
      ) : null}

      <form
        className="formulario-chat"
        onSubmit={(evento) => {
          evento.preventDefault();
          enviar();
        }}
      >
        <label htmlFor="entrada-chat" className="sr-only">
          Mensagem para o assistente
        </label>
        <input
          id="entrada-chat"
          type="text"
          autoComplete="off"
          enterKeyHint="send"
          placeholder="Pergunte sobre solo, sensor, condutividade…"
          value={entrada}
          onChange={(evento) => setEntrada(evento.target.value)}
          disabled={mutacao.isPending}
          className="botao-tecnico campo-entrada-chat"
        />
        <button
          type="submit"
          className="botao-tecnico-primario"
          disabled={mutacao.isPending || entrada.trim().length === 0}
        >
          Enviar
        </button>
      </form>
    </article>
  );
}
