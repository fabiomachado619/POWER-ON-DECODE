"use client";

import { FormEvent, useState } from "react";

interface ManufacturerRow {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  displayOrder: number;
  active: boolean;
}

export function AdminManufacturersPanel({
  manufacturers,
}: {
  manufacturers: ManufacturerRow[];
}) {
  const [message, setMessage] = useState("");
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  async function createManufacturer(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/manufacturers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, slug: newSlug }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Erro ao criar.");
      return;
    }
    window.location.reload();
  }

  async function saveManufacturer(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/admin/manufacturers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: formData.get("name"),
        displayOrder: Number(formData.get("displayOrder") ?? 0),
        active: formData.get("active") === "on",
      }),
    });
    const data = await response.json();
    setMessage(data.error ?? "Montadora atualizada.");
  }

  async function uploadLogo(id: string, file: File) {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("logo", file);
    const response = await fetch("/api/admin/manufacturers", {
      method: "PATCH",
      body: formData,
    });
    const data = await response.json();
    if (response.ok) window.location.reload();
    else setMessage(data.error ?? "Erro no upload.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Montadoras</h1>
        <p className="section-subtitle">Gerencie nomes, logos e ordem de exibição.</p>
      </div>

      {message && (
        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
          {message}
        </div>
      )}

      <form onSubmit={createManufacturer} className="card grid gap-3 md:grid-cols-3">
        <input
          className="input-field"
          placeholder="Nome"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <input
          className="input-field"
          placeholder="slug"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">
          Criar montadora
        </button>
      </form>

      {manufacturers.map((manufacturer) => (
        <form
          key={manufacturer.id}
          onSubmit={(e) => saveManufacturer(e, manufacturer.id)}
          className="card space-y-4"
        >
          <div className="flex items-center gap-4">
            {manufacturer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={manufacturer.logoUrl}
                alt={manufacturer.name}
                className="h-12 w-12 rounded-lg object-cover ring-1 ring-divider"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-muted text-xs font-bold text-brand-dark">
                {manufacturer.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs text-ink-muted">Slug: {manufacturer.slug}</p>
              <input
                name="name"
                defaultValue={manufacturer.name}
                className="input-field mt-1"
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="displayOrder"
              type="number"
              defaultValue={manufacturer.displayOrder}
              className="input-field"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={manufacturer.active} />
              Ativa
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              Salvar
            </button>
            <label className="btn-secondary cursor-pointer">
              Upload logo
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLogo(manufacturer.id, file);
                }}
              />
            </label>
          </div>
        </form>
      ))}
    </div>
  );
}
