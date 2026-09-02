/**
 * Cliente do banco de leituras usado pelo dashboard.
 *
 * Apenas URL pública e chave pública/anon são utilizadas no frontend.
 * Nenhuma chave administrativa deve aparecer neste arquivo nem no bundle.
 *
 * O acesso à base de dados é controlado pelas políticas de RLS
 * definidas no banco (ver `supabase-setup.sql`).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL_BANCO_LEITURAS = "https://jlewkyxoinwfbdpfirpp.supabase.co";
const CHAVE_PUBLICA_BANCO_LEITURAS =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZXdreXhvaW53ZmJkcGZpcnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTAzNzEsImV4cCI6MjA5ODQyNjM3MX0.Iybdl1t6Kf6oXkcJEuuecVExmC_ElPBM2SqGNW9aIfs";

if (!URL_BANCO_LEITURAS || !CHAVE_PUBLICA_BANCO_LEITURAS) {
  throw new Error(
    "URL pública e chave pública do banco de leituras não foram definidas.",
  );
}

export const supabase: SupabaseClient = createClient(
  URL_BANCO_LEITURAS,
  CHAVE_PUBLICA_BANCO_LEITURAS,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
