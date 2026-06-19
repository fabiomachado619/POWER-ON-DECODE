"use client";

import { FormEvent, useState } from "react";
import { getRoleLabel } from "@/lib/roles";

interface AdministratorRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function AdminAdministratorsPanel({
  administrators,
}: {
  administrators: AdministratorRow[];
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/administrators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Erro ao criar administrador.");
      setMessage(
        data.promoted
          ? "Usuário promovido a administrador."
          : `Administrador criado. Senha inicial: ${data.temporaryPassword ?? form.password}`
      );
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId: string, role: "admin" | "customer") {
    setMessage("");
    const response = await fetch("/api/admin/administrators", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Erro ao atualizar administrador.");
      return;
    }
    setMessage(
      role === "admin"
        ? "Usuário promovido a administrador."
        : "Administrador rebaixado para cliente."
    );
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">Administradores</h1>
        <p className="section-subtitle">
          Somente o super administrador pode criar, promover, rebaixar ou remover
          administradores da plataforma.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
          {message}
        </div>
      )}

      <form onSubmit={handleCreate} className="card grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold text-ink">
          Novo administrador
        </h2>
        <input
          className="input-field"
          placeholder="Nome"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <input
          className="input-field"
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <input
          className="input-field md:col-span-2"
          type="password"
          placeholder="Senha inicial (opcional, padrão Admin@123456)"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <button type="submit" disabled={loading} className="btn-primary md:col-span-2">
          {loading ? "Salvando..." : "Criar administrador"}
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-divider text-ink-muted">
              <th className="px-3 py-2 text-left">Administrador</th>
              <th className="px-3 py-2 text-left">Perfil</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {administrators.map((administrator) => {
              const isSuperAdmin = administrator.role === "super_admin";
              return (
                <tr key={administrator.id} className="border-b border-divider/70">
                  <td className="px-3 py-3">
                    <p className="font-medium text-ink">{administrator.name}</p>
                    <p className="text-ink-muted">{administrator.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        isSuperAdmin
                          ? "badge-unlocked"
                          : "rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink ring-1 ring-divider"
                      }
                    >
                      {getRoleLabel(administrator.role)}
                    </span>
                    {isSuperAdmin && (
                      <p className="mt-2 text-xs text-ink-muted">
                        Protegido permanentemente
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {isSuperAdmin ? (
                      <span className="text-xs text-ink-muted">Sem ações</span>
                    ) : administrator.role === "admin" ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => updateRole(administrator.id, "customer")}
                      >
                        Rebaixar para cliente
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
