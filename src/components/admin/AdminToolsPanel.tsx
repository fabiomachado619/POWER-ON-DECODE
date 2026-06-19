"use client";

import { FormEvent, useState } from "react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ToolRow {
  id: string;
  slug: string;
  displayName: string | null;
  name: string;
  description: string;
  longDescription: string | null;
  purchaseUrl: string | null;
  buttonText: string | null;
  displayOrder: number;
  featured: boolean;
  visible: boolean;
  showInStore: boolean;
  active: boolean;
  isImplemented: boolean;
  coverImageUrl: string | null;
  manufacturerName: string;
  categoryId: string;
  categoryName: string;
  registryImplemented: boolean;
  registryMissing: boolean;
}

export function AdminToolsPanel({
  tools,
  categories,
}: {
  tools: ToolRow[];
  categories: CategoryOption[];
}) {
  const [message, setMessage] = useState("");

  async function saveTool(event: FormEvent<HTMLFormElement>, toolId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      id: toolId,
      categoryId: String(formData.get("categoryId") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      description: String(formData.get("description") ?? ""),
      longDescription: String(formData.get("longDescription") ?? ""),
      purchaseUrl: String(formData.get("purchaseUrl") ?? ""),
      buttonText: String(formData.get("buttonText") ?? ""),
      displayOrder: Number(formData.get("displayOrder") ?? 0),
      featured: formData.get("featured") === "on",
      visible: formData.get("visible") === "on",
      showInStore: formData.get("showInStore") === "on",
      active: formData.get("active") === "on",
    };

    const response = await fetch("/api/admin/tools", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Erro ao salvar vitrine.");
      return;
    }
    setMessage("Ferramenta atualizada. Recarregando vitrine…");
    window.location.reload();
  }

  async function uploadCover(toolId: string, file: File) {
    const formData = new FormData();
    formData.append("id", toolId);
    formData.append("coverImage", file);
    const response = await fetch("/api/admin/tools", {
      method: "PATCH",
      body: formData,
    });
    const data = await response.json();
    setMessage(data.error ?? "Capa atualizada.");
    if (response.ok) window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Vitrine visual</h1>
        <p className="section-subtitle">
          Edite informações comerciais, URL de compra externa e categoria. Regras
          técnicas de decode não são editáveis.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
          {message}
        </div>
      )}

      {tools.map((tool) => (
        <form
          key={tool.id}
          onSubmit={(event) => saveTool(event, tool.id)}
          className="card space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-dark">
                {tool.categoryName} — {tool.manufacturerName} — slug: {tool.slug}
              </p>
              <h2 className="text-lg font-semibold text-ink">{tool.name}</h2>
              {tool.registryMissing ? (
                <p className="mt-1 text-sm text-orange-700">
                  Ferramenta visual cadastrada, mas implementação técnica ainda não
                  publicada.
                </p>
              ) : tool.isImplemented && !tool.registryImplemented ? (
                <p className="mt-1 text-sm text-orange-700">
                  Marcada como implementada na vitrine, mas o registry técnico ainda
                  não publicou a ferramenta.
                </p>
              ) : tool.registryImplemented ? (
                <p className="mt-1 text-sm text-brand-dark">
                  Implementação técnica registrada no código.
                </p>
              ) : null}
            </div>
            {tool.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tool.coverImageUrl}
                alt={tool.name}
                className="h-16 w-24 rounded-lg object-cover ring-1 ring-divider"
              />
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              name="categoryId"
              defaultValue={tool.categoryId}
              className="input-field md:col-span-2"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <input
              name="displayName"
              defaultValue={tool.displayName ?? tool.name}
              className="input-field"
              placeholder="Nome exibido"
            />
            <input
              name="displayOrder"
              type="number"
              defaultValue={tool.displayOrder}
              className="input-field"
              placeholder="Ordem"
            />
            <input
              name="purchaseUrl"
              defaultValue={tool.purchaseUrl ?? ""}
              className="input-field md:col-span-2"
              placeholder="https://checkout.exemplo.com/produto"
            />
            <input
              name="buttonText"
              defaultValue={tool.buttonText ?? ""}
              className="input-field"
              placeholder="Texto do botão"
            />
            <textarea
              name="description"
              defaultValue={tool.description}
              className="input-field md:col-span-2"
              rows={2}
            />
            <textarea
              name="longDescription"
              defaultValue={tool.longDescription ?? ""}
              className="input-field md:col-span-2"
              rows={3}
              placeholder="Descrição longa"
            />
          </div>

          <div className="space-y-3 text-sm text-ink">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="visible"
                defaultChecked={tool.visible}
                className="mt-1"
              />
              <span>
                <strong>Visível na plataforma</strong>
                <span className="mt-1 block text-ink-muted">
                  Desative para esconder temporariamente esta ferramenta de todos
                  os clientes.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="showInStore"
                defaultChecked={tool.showInStore}
                className="mt-1"
              />
              <span>
                <strong>Exibir na loja/vitrine</strong>
                <span className="mt-1 block text-ink-muted">
                  Desative para não vender esta ferramenta publicamente.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={tool.featured}
                className="mt-1"
              />
              <span>
                <strong>Destacar na página inicial</strong>
                <span className="mt-1 block text-ink-muted">
                  Exibe esta ferramenta em destaque na página inicial.
                </span>
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="active" defaultChecked={tool.active} />
              Ativo na vitrine
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary">
              Salvar vitrine
            </button>
            <label className="btn-secondary cursor-pointer">
              Upload capa
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadCover(tool.id, file);
                }}
              />
            </label>
          </div>
        </form>
      ))}
    </div>
  );
}
