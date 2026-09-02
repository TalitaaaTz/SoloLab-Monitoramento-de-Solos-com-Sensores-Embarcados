/**
 * Supabase Edge Function: chat-solo
 *
 * Assistente científico do SoloLab (UFRPE — Engenharia Agrícola / Ambiental).
 * Usa o Lovable AI Gateway (Google Gemini) — a chave LOVABLE_API_KEY é
 * provisionada automaticamente pela Lovable Cloud, nunca aparece no frontend.
 *
 * Contrato de entrada (POST JSON):
 *   {
 *     mensagem: string,               // pergunta atual
 *     historico?: Array<{ papel: "usuario"|"assistente", conteudo: string }>,
 *     dispositivoId?: string | null,
 *     periodoInicial?: string | null,
 *     periodoFinal?:   string | null,
 *     resumoLeituras?: string | null,
 *   }
 *
 * Contrato de saída:
 *   { resposta: string }             // markdown
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cabecalhosCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TurnoHistorico {
  papel: "usuario" | "assistente";
  conteudo: string;
}

interface CorpoRequisicao {
  mensagem?: unknown;
  historico?: unknown;
  dispositivoId?: unknown;
  periodoInicial?: unknown;
  periodoFinal?: unknown;
  resumoLeituras?: unknown;
}

const MODELO = "google/gemini-2.5-pro";
const URL_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const INSTRUCAO_SISTEMA = `
Você é o **Assistente Científico do SoloLab**, um projeto acadêmico da
Universidade Federal Rural de Pernambuco (UFRPE) usado no laboratório de
Água e Solo por estudantes de Engenharia Agrícola e Engenharia Ambiental.

## Missão
Explicar de forma técnica e correta conceitos de física, química e biologia
do solo, e ajudar a interpretar leituras BRUTAS de um sensor THC-S conectado
a um ESP32 (temperatura, umidade volumétrica bruta, condutividade elétrica
bruta em µS/cm e um canal analógico auxiliar em contagens ADC).

## Como responder
- Sempre em **português do Brasil**, tom técnico-acadêmico, sem gírias.
- **Seja direto e curto por padrão** (3–6 linhas). Nada de textão.
- Use **Markdown**: negrito em termos-chave, listas quando ajudar, blocos
  de código para fórmulas/valores. Sem emojis decorativos.
- Ao final de uma resposta curta, quando o tema tiver profundidade,
  **ofereça expansão**: pergunte se o(a) estudante quer uma resposta mais
  detalhada com fontes, referências bibliográficas e exemplos aplicados
  ao laboratório.
- Se a pessoa pedir aprofundamento, entregue explicação estruturada
  (Definição → Princípio físico/químico → Faixas típicas → Fatores que
  influenciam → Aplicação no laboratório) e **cite fontes**.

## Fontes e citações
Ao citar, prefira referências reconhecidas na área de Ciência do Solo:
- Embrapa Solos — *Manual de Métodos de Análise de Solo* (3ª ed., 2017).
- Ronald J. Reynolds & Denis E. Elrick — métodos hidráulicos.
- Hillel, D. *Environmental Soil Physics* (2004).
- Sparks, D. L. *Environmental Soil Chemistry* (2003).
- Richards, L. A. (ed.) — *Diagnosis and Improvement of Saline and Alkali
  Soils*, USDA Agriculture Handbook 60 (1954) — referência clássica de CE.
- Normas ABNT/NBR e boletins técnicos do IAC/Embrapa quando pertinente.
- Artigos indexados (Scopus/SciELO) — sempre com autor, ano e periódico.

Formato de citação no texto: *(Embrapa, 2017)* ou *(Hillel, 2004, cap. 8)*.
Ao final, quando aprofundar, liste as **Referências** em lista markdown.
**Nunca invente autor, ano, DOI ou link.** Se não tiver certeza, diga:
"referência a confirmar" e sugira onde buscar (SciELO, Google Scholar,
biblioteca da UFRPE).

## Regras sobre os dados do SoloLab
- Todos os valores da tabela \`leituras_solo\` são **brutos** e estão em
  **fase de calibração laboratorial**. Nunca afirme que a condutividade
  está em dS/m calibrado nem trate a umidade como % volumétrica final.
- Nunca recomende irrigação automática, adubação específica ou
  diagnóstico definitivo de salinidade a partir dos brutos.
- Se faltar dado no contexto enviado, diga isso explicitamente em vez
  de inventar número.
- Lembre, quando relevante, que a resposta é apoio didático e **não
  substitui análise laboratorial nem parecer de profissional habilitado**.
`.trim();

Deno.serve(async (requisicao) => {
  if (requisicao.method === "OPTIONS") {
    return new Response(null, { headers: cabecalhosCors });
  }
  if (requisicao.method !== "POST") {
    return responderJson({ erro: "Método não permitido." }, 405);
  }

  const chave = Deno.env.get("LOVABLE_API_KEY");
  if (!chave) {
    return responderJson(
      { erro: "LOVABLE_API_KEY ausente no ambiente da Edge Function." },
      500,
    );
  }

  let corpo: CorpoRequisicao;
  try {
    corpo = await requisicao.json();
  } catch {
    return responderJson({ erro: "JSON inválido." }, 400);
  }

  const mensagem =
    typeof corpo.mensagem === "string" ? corpo.mensagem.trim() : "";
  if (!mensagem) {
    return responderJson({ erro: "Campo 'mensagem' é obrigatório." }, 400);
  }

  const historico: TurnoHistorico[] = Array.isArray(corpo.historico)
    ? (corpo.historico as unknown[])
        .filter(
          (item): item is TurnoHistorico =>
            !!item &&
            typeof item === "object" &&
            (["usuario", "assistente"] as const).includes(
              (item as TurnoHistorico).papel,
            ) &&
            typeof (item as TurnoHistorico).conteudo === "string",
        )
        .slice(-20) // últimos 20 turnos, evita estourar contexto
    : [];

  const dispositivoId =
    typeof corpo.dispositivoId === "string" ? corpo.dispositivoId : null;
  const periodoInicial =
    typeof corpo.periodoInicial === "string" ? corpo.periodoInicial : null;
  const periodoFinal =
    typeof corpo.periodoFinal === "string" ? corpo.periodoFinal : null;
  const resumoLeituras =
    typeof corpo.resumoLeituras === "string" ? corpo.resumoLeituras : null;

  const contexto = [
    dispositivoId ? `- Dispositivo: ${dispositivoId}` : null,
    periodoInicial && periodoFinal
      ? `- Janela analisada: ${periodoInicial} → ${periodoFinal}`
      : null,
    resumoLeituras ? `- Resumo estatístico: ${resumoLeituras}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const mensagensChat = [
    { role: "system", content: INSTRUCAO_SISTEMA },
    ...historico.map((t) => ({
      role: t.papel === "usuario" ? "user" : "assistant",
      content: t.conteudo,
    })),
    {
      role: "user",
      content: contexto
        ? `Contexto atual do painel:\n${contexto}\n\nPergunta: ${mensagem}`
        : mensagem,
    },
  ];

  try {
    const respostaGateway = await fetch(URL_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELO,
        messages: mensagensChat,
        temperature: 0.4,
      }),
    });

    if (respostaGateway.status === 429) {
      return responderJson(
        {
          erro:
            "Muitas requisições ao assistente. Aguarde alguns segundos e tente novamente.",
        },
        429,
      );
    }
    if (respostaGateway.status === 402) {
      return responderJson(
        {
          erro:
            "Créditos do Lovable AI esgotados. Adicione créditos no workspace para continuar usando o assistente.",
        },
        402,
      );
    }
    if (!respostaGateway.ok) {
      const detalhe = await respostaGateway.text();
      console.error("Gateway erro", respostaGateway.status, detalhe);
      return responderJson(
        { erro: `Falha no gateway de IA (${respostaGateway.status}).` },
        502,
      );
    }

    const dados = await respostaGateway.json();
    const texto: string =
      dados?.choices?.[0]?.message?.content?.toString().trim() ?? "";
    if (!texto) {
      return responderJson({ erro: "Resposta vazia do modelo." }, 502);
    }
    return responderJson({ resposta: texto }, 200);
  } catch (erro) {
    console.error("Erro chat-solo:", erro);
    return responderJson(
      { erro: "Erro interno ao processar a conversa." },
      500,
    );
  }
});

function responderJson(corpo: unknown, status: number) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhosCors, "Content-Type": "application/json" },
  });
}
