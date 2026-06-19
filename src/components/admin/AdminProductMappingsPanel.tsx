"use client";

import { FormEvent, useState } from "react";

interface MappingRow {
  id: string;
  externalProductId: string;
  toolSlug: string;
  active: boolean;
}

interface ToolOption {
  slug: string;
  name: string;
}

export function AdminProductMappingsPanel({
  mappings,
  tools,
}: {
  mappings: MappingRow[];
  tools: ToolOption[];
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    externalProductId: "",
    toolSlug: tools[0]?.slug ?? "",
    active: true,
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/product-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Erro ao salvar mapeamento.");
      setMessage("Mapeamento salvo com sucesso.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(mapping: MappingRow) {
    const response = await fetch("/api/admin/product-mappings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: mapping.id,
        externalProductId: mapping.externalProductId,
        toolSlug: mapping.toolSlug,
        active: !mapping.active,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Erro ao atualizar mapeamento.");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">Mapeamento de produtos</h1>
        <p className="section-subtitle">
          Associe o ID externo do checkout à ferramenta interna. O webhook usa
          apenas o product_id para liberar acesso automaticamente.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold text-ink">
          Novo mapeamento
        </h2>
        <input
          className="input-field"
          placeholder="ID externo do produto (ex: SSANGYONG_01)"
          value={form.externalProductId}
          onChange={(event) =>
            setForm({ ...form, externalProductId: event.target.value })
          }
          required
        />
        <select
          className="input-field"
          value={form.toolSlug}
          onChange={(event) => setForm({ ...form, toolSlug: event.target.value })}
          required
        >
          {tools.map((tool) => (
            <option key={tool.slug} value={tool.slug}>
              {tool.name} ({tool.slug})
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink md:col-span-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm({ ...form, active: event.target.checked })}
          />
          Mapeamento ativo
        </label>
        <button type="submit" disabled={loading} className="btn-primary md:col-span-2">
          {loading ? "Salvando..." : "Salvar mapeamento"}
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-divider text-ink-muted">
              <th className="px-3 py-2 text-left">Produto externo</th>
              <th className="px-3 py-2 text-left">Ferramenta</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping) => (
              <tr key={mapping.id} className="border-b border-divider/70">
                <td className="px-3 py-3 font-medium text-ink">
                  {mapping.externalProductId}
                </td>
                <td className="px-3 py-3 text-ink-muted">{mapping.toolSlug}</td>
                <td className="px-3 py-3">
                  {mapping.active ? (
                    <span className="badge-unlocked">Ativo</span>
                  ) : (
                    <span className="badge-blocked">Inativo</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => toggleActive(mapping)}
                  >
                    {mapping.active ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
