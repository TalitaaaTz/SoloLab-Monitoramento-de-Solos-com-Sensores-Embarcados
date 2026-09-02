/**
 * Componente reutilizável para estados vazios.
 * Usado quando não há leituras ou análises a exibir.
 */

interface PropriedadesEstadoVazio {
  titulo: string;
  descricao?: string;
}

export function EstadoVazio({ titulo, descricao }: PropriedadesEstadoVazio) {
  return (
    <div
      className="cartao"
      style={{
        textAlign: "center",
        color: "var(--color-muted-foreground)",
        padding: "2rem 1rem",
      }}
    >
      <p style={{ margin: 0, fontWeight: 500, color: "var(--color-foreground)" }}>
        {titulo}
      </p>
      {descricao ? (
        <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem" }}>{descricao}</p>
      ) : null}
    </div>
  );
}
