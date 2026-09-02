/**
 * Aviso discreto, sempre visível, indicando que os dados ainda dependem
 * de calibração laboratorial. Estilo suave e arredondado.
 */

import { AVISO_CALIBRACAO } from "@/utilitarios/constantes";

export function AvisoCalibracao() {
  return (
    <aside
      role="note"
      style={{
        background:
          "color-mix(in oklch, var(--color-warning) 10%, var(--color-surface))",
        color: "var(--color-warning-foreground)",
        padding: "0.7rem 0.95rem",
        fontSize: "0.9rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
        border: "1px solid color-mix(in oklch, var(--color-warning) 30%, var(--color-border))",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-suave)",
        textAlign: "center",
      }}
    >
      {AVISO_CALIBRACAO}
    </aside>
  );
}
