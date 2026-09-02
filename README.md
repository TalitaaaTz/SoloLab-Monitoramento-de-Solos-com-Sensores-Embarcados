# SoloLab — Monitoramento de Variáveis de Solo

Dashboard acadêmico em **React + TypeScript + Vite** para acompanhar leituras brutas
de um sensor THC-S conectado a um ESP32. O backend é 100% Supabase; a única função
remota é uma Edge Function (`chat-solo`) que protege a chave da API Gemini usada
pelo assistente.

> ⚠️ Os dados estão em **fase de calibração laboratorial**. Os valores apresentados
> são leituras brutas dos sensores — não devem ser usados como diagnóstico definitivo.

## Arquitetura

```
ESP32 ──► Supabase REST API ──► tabela public.leituras_solo
                                        │
                                        ▼
                  Dashboard React/Vite (build estático / APK)
                                        │
                                        ▼
                  Supabase Edge Function "chat-solo" ──► Google Gemini
```

- Não há backend próprio.
- Não há rotas de servidor (sem TanStack Start, sem Node, sem `/api/*`).
- O frontend consulta o Supabase diretamente com a chave **pública** (`anon`).
- O chatbot usa apenas a Edge Function `chat-solo`.

## Estrutura de pastas

```
src/
  componentes/         componentes reutilizáveis (cartões, gráfico, tabela, chat)
  paginas/             telas (PaginaPainel, PaginaHistorico, PaginaChatSolo)
  servicos/            chamadas ao Supabase e à Edge Function
  tipos/               tipos de domínio (LeituraSolo, MensagemChat, …)
  utilitarios/         constantes, formatadores, exportar CSV
  integracoes/
    supabase/cliente.ts  cliente único do Supabase
  estilos/global.css   sistema de design único
supabase/
  functions/chat-solo/index.ts  código da Edge Function do chatbot
supabase-setup.sql     SQL inicial (tabelas + RLS + GRANTs)
```

## Instalação local

```bash
cp .env.example .env       # preencha com as chaves do seu projeto Supabase
npm install                # ou bun install / pnpm install
npm run dev                # http://localhost:8080
```

Variáveis de ambiente aceitas (apenas públicas):

| Variável | Onde encontrar |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → anon public key |

## Build de produção

```bash
npm run build       # gera dist/ com HTML, JS e CSS estáticos
npm run preview     # serve a pasta dist/ localmente para conferência
```

A pasta `dist/` é totalmente estática e pode ser hospedada em qualquer CDN
(GitHub Pages, Cloudflare Pages, Netlify, Vercel) **ou** empacotada como APK
com o Capacitor.

## Preparação para Capacitor (APK Android)

```bash
npm install -D @capacitor/cli
npm install @capacitor/core @capacitor/android
npx cap init "SoloLab" "br.sololab.app" --web-dir=dist
npm run build
npx cap add android
npx cap sync android
npx cap open android   # abre no Android Studio
```

O app não depende de servidor próprio para funcionar — o roteamento usa
`HashRouter`, compatível com WebView do Android e iOS.

## Configuração do Supabase

1. Crie um projeto em <https://supabase.com>.
2. Em **SQL Editor**, rode o conteúdo de `supabase-setup.sql`.
3. Copie a `Project URL` e a `anon public key` para o arquivo `.env`.

A tabela `public.leituras_solo` já vem com RLS habilitado:

- Qualquer um pode **ler** apenas leituras com `status_leitura = 'valida'`.
- O ESP32 pode **inserir** apenas se `dispositivo_id = 'esp32-lab-01'` e os
  parâmetros estiverem dentro dos limites validados (ver SQL).

## Como o ESP32 envia dados

O firmware envia uma média de 10 leituras a cada ~6 segundos diretamente
ao Supabase, usando a chave pública (`anon`) e a API REST:

```cpp
HTTPClient http;
http.begin("https://SEU-PROJETO.supabase.co/rest/v1/leituras_solo");
http.addHeader("apikey", "SUA_CHAVE_ANON_PUBLICA");
http.addHeader("Authorization", "Bearer SUA_CHAVE_ANON_PUBLICA");
http.addHeader("Content-Type", "application/json");
http.addHeader("Prefer", "return=minimal");

String corpo = "{"
  "\"dispositivo_id\":\"esp32-lab-01\","
  "\"temperatura_thcs_bruta\":25.4,"
  "\"umidade_thcs_bruta\":61.2,"
  "\"condutividade_thcs_bruta\":840,"
  "\"solo_analogico_bruto\":2380,"
  "\"quantidade_amostras\":10,"
  "\"intervalo_amostra_ms\":6000,"
  "\"status_leitura\":\"valida\""
"}";
http.POST(corpo);
```

> Uma leitura é considerada **inválida** somente quando `umidade_thcs_bruta = 0`
> **e** `condutividade_thcs_bruta = 0` ao mesmo tempo. Não envie esses casos —
> ou envie com `status_leitura = 'invalida'` apenas para registro local.

## Como criar a Edge Function `chat-solo`

```bash
# 1. Instale a CLI do Supabase
npm install -g supabase

# 2. Faça login e linke o projeto
supabase login
supabase link --project-ref SEU_PROJECT_REF

# 3. Configure a chave do Gemini (gratuita: https://aistudio.google.com/app/apikey)
supabase secrets set GEMINI_API_KEY=AIza...

# 4. Faça o deploy
supabase functions deploy chat-solo --no-verify-jwt
```

O dashboard chama a função assim:

```ts
supabase.functions.invoke("chat-solo", {
  body: { mensagem, dispositivoId, periodoInicial, periodoFinal },
});
```

A `GEMINI_API_KEY` **nunca** entra no frontend.

## Status dos dados

Todos os valores são **brutos**:

- `temperatura_thcs_bruta` — leitura direta do sensor THC-S.
- `umidade_thcs_bruta` — não representa umidade calibrada em %.
- `condutividade_thcs_bruta` — não está em dS/m calibrado.
- `solo_analogico_bruto` — saída ADC do canal analógico auxiliar.

A calibração laboratorial é obrigatória antes de qualquer interpretação técnica.
