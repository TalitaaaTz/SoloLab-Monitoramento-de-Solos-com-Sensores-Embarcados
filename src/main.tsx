/**
 * Ponto de entrada da aplicação.
 * Monta o React em #root, aplica o roteamento por hash (compatível
 * com Capacitor/APK, já que o WebView abre arquivos locais sem servidor)
 * e fornece o QueryClient para todos os componentes.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./estilos/global.css";
import { App } from "./App";

const clienteConsulta = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const elementoRaiz = document.getElementById("root");
if (!elementoRaiz) {
  throw new Error("Elemento #root não encontrado no documento HTML.");
}

createRoot(elementoRaiz).render(
  <StrictMode>
    <QueryClientProvider client={clienteConsulta}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
);
