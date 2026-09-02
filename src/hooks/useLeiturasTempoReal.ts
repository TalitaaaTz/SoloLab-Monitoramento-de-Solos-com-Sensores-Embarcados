import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integracoes/supabase/cliente";

export function useLeiturasTempoReal() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const atualizarLeituras = () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "leituras-solo",
      });
      queryClient.invalidateQueries({ queryKey: ["dispositivos"] });
    };

    const canal = supabase
      .channel("leituras-solo-tempo-real")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leituras_solo" },
        atualizarLeituras,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") atualizarLeituras();
      });

    return () => {
      supabase.removeChannel(canal);
    };
  }, [queryClient]);
}