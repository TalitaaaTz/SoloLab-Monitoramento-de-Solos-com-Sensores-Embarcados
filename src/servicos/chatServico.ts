/**
 * Serviço do chatbot científico do SoloLab.
 *
 * A Edge Function `chat-solo` está hospedada na infraestrutura Lovable Cloud
 * (onde a LOVABLE_API_KEY é provisionada automaticamente). Como o cliente
 * Supabase padrão do app foi apontado para o projeto pessoal do usuário
 * (para leitura das tabelas `leituras_solo` / `analises_ia`), aqui usamos
 * um `fetch` direto para a URL pública da função na Lovable Cloud.
 *
 * A URL e a chave anon abaixo são PÚBLICAS por design (RLS protege os dados).
 */

// Projeto Lovable Cloud que hospeda a Edge Function `chat-solo`.
const URL_FUNCAO_CHAT =
  "https://czwovnwuirfcjykuytmm.supabase.co/functions/v1/chat-solo";
const CHAVE_ANON_LOVABLE_CLOUD =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6d292bnd1aXJmY2p5a3V5dG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjI0NzMsImV4cCI6MjA5ODMzODQ3M30.SRr8QSNtILmb4-Rg_yQqWTWVjor0lvMx76MLh4rq5EE";

export interface TurnoConversa {
  papel: "usuario" | "assistente";
  conteudo: string;
}

export interface ParametrosChatSolo {
  mensagem: string;
  historico?: TurnoConversa[];
  dispositivoId?: string;
  periodoInicial?: string;
  periodoFinal?: string;
  resumoLeituras?: string;
}

export interface RespostaChatSolo {
  resposta: string;
}

export async function conversarComAssistente(
  parametros: ParametrosChatSolo,
): Promise<RespostaChatSolo> {
  const resposta = await fetch(URL_FUNCAO_CHAT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: CHAVE_ANON_LOVABLE_CLOUD,
      Authorization: `Bearer ${CHAVE_ANON_LOVABLE_CLOUD}`,
    },
    body: JSON.stringify({
      mensagem: parametros.mensagem,
      historico: parametros.historico ?? [],
      dispositivoId: parametros.dispositivoId ?? null,
      periodoInicial: parametros.periodoInicial ?? null,
      periodoFinal: parametros.periodoFinal ?? null,
      resumoLeituras: parametros.resumoLeituras ?? null,
    }),
  });

  if (!resposta.ok) {
    let mensagemErro = `Falha ao consultar o assistente (HTTP ${resposta.status}).`;
    try {
      const dados = (await resposta.json()) as { erro?: string };
      if (dados?.erro) mensagemErro = dados.erro;
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(mensagemErro);
  }

  const dados = (await resposta.json()) as Partial<RespostaChatSolo>;
  if (!dados || typeof dados.resposta !== "string") {
    throw new Error("Resposta inválida recebida da função chat-solo.");
  }
  return { resposta: dados.resposta };
}
