import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:8081";

const formInicial = {
  nomeProduto: "",
  quantidade: 1,
  precoEstimado: "",
  categoria: "Alimentos",
  mercado: "",
  cidade: "",
  comprado: false,
  observacao: "",
};

export default function App() {
  const [itens, setItens] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [apiStatus, setApiStatus] = useState("Verificando...");

  useEffect(() => {
    buscarItens();
    verificarHealth();
  }, []);

  async function verificarHealth() {
    try {
      const response = await fetch(`${API}/health`);
      if (!response.ok) throw new Error();
      setApiStatus("API online");
    } catch {
      setApiStatus("API indisponível");
    }
  }

  async function buscarItens() {
    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(`${API}/itens`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar os itens.");
      }

      const data = await response.json();
      setItens(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.message || "Erro ao buscar itens.");
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function limparFormulario() {
    setForm(formInicial);
    setEditandoId(null);
    setErro("");
  }

  function validarFormulario() {
    if (!form.nomeProduto.trim()) {
      setErro("Informe o nome do produto.");
      return false;
    }

    if (!form.quantidade || Number(form.quantidade) <= 0) {
      setErro("Informe uma quantidade maior que zero.");
      return false;
    }

    if (form.precoEstimado === "" || Number(form.precoEstimado) < 0) {
      setErro("Informe um preço estimado válido.");
      return false;
    }

    return true;
  }

  async function salvarItem(e) {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setSalvando(true);
      setErro("");

      const payload = {
        nomeProduto: form.nomeProduto.trim(),
        quantidade: Number(form.quantidade),
        precoEstimado: Number(form.precoEstimado),
        categoria: form.categoria.trim(),
        mercado: form.mercado.trim(),
        cidade: form.cidade.trim(),
        comprado: Boolean(form.comprado),
        observacao: form.observacao.trim(),
      };

      const url =
        editandoId !== null ? `${API}/itens/${editandoId}` : `${API}/itens`;

      const method = editandoId !== null ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          editandoId !== null
            ? "Não foi possível atualizar o item."
            : "Não foi possível cadastrar o item."
        );
      }

      await buscarItens();
      limparFormulario();
    } catch (err) {
      setErro(err.message || "Erro ao salvar item.");
    } finally {
      setSalvando(false);
    }
  }

  async function deletarItem(id) {
    const confirmar = window.confirm("Deseja realmente excluir este item?");
    if (!confirmar) return;

    try {
      setErro("");

      const response = await fetch(`${API}/itens/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Não foi possível excluir o item.");
      }

      setItens((prev) => prev.filter((item) => item.id !== id));

      if (editandoId === id) {
        limparFormulario();
      }
    } catch (err) {
      setErro(err.message || "Erro ao excluir item.");
    }
  }

  function editarItem(item) {
    setEditandoId(item.id);
    setForm({
      nomeProduto: item.nomeProduto ?? "",
      quantidade: item.quantidade ?? 1,
      precoEstimado: item.precoEstimado ?? "",
      categoria: item.categoria ?? "Alimentos",
      mercado: item.mercado ?? "",
      cidade: item.cidade ?? "",
      comprado: item.comprado ?? false,
      observacao: item.observacao ?? "",
    });
    setErro("");
  }

  const itensFiltrados = useMemo(() => {
    return itens.filter((item) => {
      const termo = busca.toLowerCase();
      return (
        String(item.nomeProduto || "").toLowerCase().includes(termo) ||
        String(item.categoria || "").toLowerCase().includes(termo) ||
        String(item.mercado || "").toLowerCase().includes(termo) ||
        String(item.cidade || "").toLowerCase().includes(termo) ||
        String(item.observacao || "").toLowerCase().includes(termo)
      );
    });
  }, [itens, busca]);

  const totalEstimado = useMemo(() => {
    return itensFiltrados.reduce((total, item) => {
      return total + Number(item.precoEstimado || 0) * Number(item.quantidade || 0);
    }, 0);
  }, [itensFiltrados]);

  const totalComprados = useMemo(() => {
    return itensFiltrados.filter((item) => item.comprado).length;
  }, [itensFiltrados]);

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.2em] text-yellow-400">
                Lista de Compras
              </p>
              <h1 className="text-3xl font-bold md:text-4xl">
                Gerenciador de Itens
              </h1>
              <p className="mt-2 text-gray-400">
                Cadastre, edite, busque e marque os produtos da sua compra.
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm">
              <span className="font-semibold text-gray-300">Status da API: </span>
              <span
                className={
                  apiStatus === "API online" ? "text-green-400" : "text-red-400"
                }
              >
                {apiStatus}
              </span>
            </div>
          </div>
        </header>

        {erro && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {erro}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">
              {editandoId !== null ? "Editar item" : "Novo item"}
            </h2>

            <form onSubmit={salvarItem} className="space-y-4">
              {editandoId && (
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    ID do Item
                  </label>
                  <input
                    type="text"
                    value={editandoId}
                    readOnly
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-gray-400"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Nome do produto
                </label>
                <input
                  type="text"
                  name="nomeProduto"
                  value={form.nomeProduto}
                  onChange={atualizarCampo}
                  placeholder="Ex: Arroz"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Quantidade
                </label>
                <input
                  type="number"
                  name="quantidade"
                  min="1"
                  value={form.quantidade}
                  onChange={atualizarCampo}
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Preço estimado
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="precoEstimado"
                  value={form.precoEstimado}
                  onChange={atualizarCampo}
                  placeholder="Ex: 12.50"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Categoria
                </label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={atualizarCampo}
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                >
                  <option>Alimentos</option>
                  <option>Bebidas</option>
                  <option>Limpeza</option>
                  <option>Higiene</option>
                  <option>Frios</option>
                  <option>Padaria</option>
                  <option>Outros</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Mercado
                </label>
                <input
                  type="text"
                  name="mercado"
                  value={form.mercado}
                  onChange={atualizarCampo}
                  placeholder="Ex: Assaí"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Cidade
                </label>
                <input
                  type="text"
                  name="cidade"
                  value={form.cidade}
                  onChange={atualizarCampo}
                  placeholder="Ex: São Paulo"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Observação
                </label>
                <textarea
                  name="observacao"
                  value={form.observacao}
                  onChange={atualizarCampo}
                  placeholder="Ex: pegar promoção da marca X"
                  rows={3}
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-300">
                <input
                  type="checkbox"
                  name="comprado"
                  checked={form.comprado}
                  onChange={atualizarCampo}
                />
                Item já comprado
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando
                    ? "Salvando..."
                    : editandoId !== null
                      ? "Atualizar"
                      : "Adicionar"}
                </button>

                <button
                  type="button"
                  onClick={limparFormulario}
                  className="rounded-xl border border-gray-700 px-5 py-3 font-semibold text-gray-200 transition hover:bg-gray-800"
                >
                  Limpar
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Itens da compra</h2>
                <p className="mt-1 text-sm text-gray-400">
                  {itensFiltrados.length} item(ns) encontrado(s) • {totalComprados} comprado(s)
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  placeholder="Buscar por nome, categoria, mercado, cidade ou observação..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                />

                <div className="rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm">
                  <span className="text-gray-400">Total estimado: </span>
                  <span className="font-bold text-yellow-400">
                    {formatarMoeda(totalEstimado)}
                  </span>
                </div>
              </div>
            </div>

            {carregando ? (
              <p className="text-gray-400">Carregando itens...</p>
            ) : itensFiltrados.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-700 bg-gray-950 p-6 text-center text-gray-400">
                Nenhum item encontrado.
              </div>
            ) : (
              <div className="space-y-4">
                {itensFiltrados.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-800 bg-gray-950 p-4 transition hover:border-yellow-400/40"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{item.nomeProduto}</h3>
                          <span className="rounded-full border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300">
                            #{item.id}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.comprado
                                ? "bg-green-500/10 text-green-400 border border-green-500/30"
                                : "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30"
                            }`}
                          >
                            {item.comprado ? "Comprado" : "Pendente"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-400">
                          <span className="rounded-full border border-gray-700 px-3 py-1">
                            Categoria: {item.categoria}
                          </span>
                          <span className="rounded-full border border-gray-700 px-3 py-1">
                            Mercado: {item.mercado || "Não informado"}
                          </span>
                          <span className="rounded-full border border-gray-700 px-3 py-1">
                            Cidade: {item.cidade || "Não informado"}
                          </span>
                          <span className="rounded-full border border-gray-700 px-3 py-1">
                            Quantidade: {item.quantidade}
                          </span>
                          {item.observacao && (
                            <span className="rounded-full border border-gray-700 px-3 py-1">
                              Obs: {item.observacao}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <span className="text-xl font-bold text-yellow-400">
                          {formatarMoeda(
                            Number(item.precoEstimado || 0) * Number(item.quantidade || 0)
                          )}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => editarItem(item)}
                            className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => deletarItem(item.id)}
                            className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}