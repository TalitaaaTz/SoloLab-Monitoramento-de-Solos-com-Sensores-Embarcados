## O chatbot no APK

Funciona igual, sem mudança nenhuma. Segue o motivo em 3 linhas:

- O `PainelChatSolo` chama `conversarComAssistente()` em `src/servicos/chatServico.ts`.
- Esse serviço faz um `fetch` HTTPS direto pra Edge Function `chat-solo` hospedada na **Lovable Cloud** (`https://czwovnwuirfcjykuytmm.supabase.co/functions/v1/chat-solo`).
- A Edge Function é quem fala com o Gemini usando a `LOVABLE_API_KEY` do servidor. **Nenhuma chave de IA vai pro celular.**

## Requisitos pro chatbot funcionar no APK

1. **Internet no celular** — a Edge Function é remota, então precisa de rede. Sem internet, só o chat fica indisponível (o resto do app continua mostrando o cache do React Query).
2. **A Edge Function `chat-solo` continuar publicada na Lovable Cloud** — hoje já está. Enquanto o projeto Lovable existir, ela responde.
3. **Créditos da Lovable AI na sua workspace** — cada mensagem consome créditos da sua conta Lovable, não do usuário. Se zerar, o chat retorna erro 402 e o app já mostra a mensagem de erro.
4. **`allowMixedContent: false`** no `capacitor.config.ts` (já configurado) — como a Edge Function é HTTPS, o WebView aceita sem precisar liberar tráfego inseguro.

## O que NÃO precisa fazer

- Nenhuma configuração extra no Android.
- Nenhuma permissão especial no `AndroidManifest.xml` além de `INTERNET` (o Capacitor já adiciona por padrão).
- Não precisa embutir a chave do Gemini no app.
- Não precisa mexer no `chatServico.ts`.

## Como testar depois de gerar o APK

1. Instalar o APK no celular.
2. Abrir o app com Wi-Fi ativo.
3. Ir na aba do assistente e mandar uma mensagem tipo "o que é condutividade elétrica do solo?".
4. Se responder, tá tudo certo. Se der erro, olhar os logs da Edge Function `chat-solo` no painel da Lovable pra ver se foi 429 (rate limit), 402 (créditos) ou outro.

## Resumindo

Não precisa mexer em nada. O plano do APK do turno anterior já cobre o chatbot — ele vai funcionar assim que o APK abrir com internet.
