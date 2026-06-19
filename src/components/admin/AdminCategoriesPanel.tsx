"use client";

import { FormEvent, useState } from "react";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  displayOrder: number;
  active: boolean;
  toolCount: number;
}

export function AdminCategoriesPanel({
  categories,
}: {
  categories: CategoryRow[];
}) {
  const [message, setMessage] = useState("");
  const [newCat, setNewCat] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
  });

  async function createCategory(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCat),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Erro ao criar.");
      return;
    }
    window.location.reload();
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        icon: formData.get("icon"),
        displayOrder: Number(formData.get("displayOrder") ?? 0),
        active: formData.get("active") === "on",
      }),
    });
    const data = await response.json();
    setMessage(data.error ?? "Categoria atualizada.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Categorias de ferramentas</h1>
        <p className="section-subtitle">
          Decode, Reset, Odômetro, Checksum e outras categorias de serviço.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
          {message}
        </div>
      )}

      <form onSubmit={createCategory} className="card grid gap-3 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold text-ink">Nova categoria</h2>
        <input
          className="input-field"
          placeholder="Nome"
          value={newCat.name}
          onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
          required
        />
        <input
          className="input-field"
          placeholder="slug"
          value={newCat.slug}
          onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
          required
        />
        <input
          className="input-field md:col-span-2"
          placeholder="Descrição"
          value={newCat.description}
          onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
          required
        />
        <input
          className="input-field"
          placeholder="Ícone (emoji ou texto)"
          value={newCat.icon}
          onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
        />
        <button type="submit" className="btn-primary">
          Criar categoria
        </button>
      </form>

      {categories.map((category) => (
        <form
          key={category.id}
          onSubmit={(e) => saveCategory(e, category.id)}
          className="card space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              {category.toolCount} ferramenta{category.toolCount === 1 ? "" : "s"}
            </p>
            {category.icon && (
              <span className="text-2xl">{category.icon}</span>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input name="name" defaultValue={category.name} className="input-field" />
            <input name="slug" defaultValue={category.slug} className="input-field" />
            <textarea
              name="description"
              defaultValue={category.description}
              className="input-field md:col-span-2"
              rows={2}
            />
            <input name="icon" defaultValue={category.icon ?? ""} className="input-field" />
            <input
              name="displayOrder"
              type="number"
              defaultValue={category.displayOrder}
              className="input-field"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={category.active} />
            Ativa
          </label>
          <button type="submit" className="btn-primary">
            Salvar categoria
          </button>
        </form>
      ))}
    </div>
  );
}
