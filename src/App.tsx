/**
 * Componente raiz do aplicativo.
 * Define a estrutura comum (cabeçalho, navegação, rodapé) e o roteamento
 * entre as três páginas: Painel principal, Histórico e Assistente.
 */

import { NavLink, Route, Routes } from "react-router-dom";

import logoSoloLab from "@/assets/logo-sololab.png";
import { PaginaPainel } from "@/paginas/PaginaPainel";
import { PaginaHistorico } from "@/paginas/PaginaHistorico";
import { PaginaChatSolo } from "@/paginas/PaginaChatSolo";
import { useLeiturasTempoReal } from "@/hooks/useLeiturasTempoReal";

const ITENS_NAVEGACAO = [
  { para: "/", rotulo: "Painel principal", final: true },
  { para: "/historico", rotulo: "Histórico", final: false },
  { para: "/assistente", rotulo: "Assistente", final: false },
];

export function App() {
  useLeiturasTempoReal();

  return (
    <div className="invólucro-app">
      <header className="cabecalho-app">
        <img
          src={logoSoloLab}
          alt="Logotipo SoloLab"
          width={56}
          height={56}
          className="logo-app"
        />
        <div className="titulo-app">
          <p className="rotulo-tecnico marca-app">SoloLab</p>
          <h1>Monitoramento de Variáveis de Solo</h1>
        </div>
      </header>

      <nav aria-label="Navegação principal" className="navegacao-principal">
        {ITENS_NAVEGACAO.map((item) => (
          <NavLink
            key={item.para}
            to={item.para}
            end={item.final}
            className={({ isActive }) =>
              `item-navegacao${isActive ? " item-navegacao-ativo" : ""}`
            }
          >
            {item.rotulo}
          </NavLink>
        ))}
      </nav>

      <main className="conteudo-principal">
        <Routes>
          <Route path="/" element={<PaginaPainel />} />
          <Route path="/historico" element={<PaginaHistorico />} />
          <Route path="/assistente" element={<PaginaChatSolo />} />
          <Route
            path="*"
            element={
              <section className="cartao" style={{ textAlign: "center" }}>
                <h2>Página não encontrada</h2>
                <p>O endereço acessado não corresponde a nenhuma área do dashboard.</p>
              </section>
            }
          />
        </Routes>
      </main>

      <footer className="rodape-app">
        SoloLab — projeto acadêmico de monitoramento de solo.
      </footer>
    </div>
  );
}
