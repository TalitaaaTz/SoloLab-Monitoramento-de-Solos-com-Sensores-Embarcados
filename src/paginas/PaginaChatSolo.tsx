/**
 * Página: Assistente de Monitoramento do Solo.
 * Conversa com o usuário através da Supabase Edge Function "chat-solo".
 * A chave do Gemini fica protegida no backend.
 */

import { PainelChatSolo } from "@/componentes/PainelChatSolo";

export function PaginaChatSolo() {
  return (
    <section className="pilha-paginas">
      <header className="cabecalho-pagina">
        <div>
          <p className="rotulo-tecnico">Assistente</p>
          <h2 style={{ margin: "0.15rem 0 0" }}>
            Assistente de Monitoramento do Solo
          </h2>
        </div>
      </header>
      <PainelChatSolo />
    </section>
  );
}
