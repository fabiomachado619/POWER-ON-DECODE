"use client";

import { useState } from "react";

interface AccessRow {
  id: string;
  userName: string;
  userEmail: string;
  moduleName: string;
  moduleSlug: string;
  accessStatus: string;
  startsAt: string | null;
  expiresAt: string | null;
  source: string | null;
}

export function AdminAccessPanel({
  accesses,
  modules,
}: {
  accesses: AccessRow[];
  modules: Array<{ slug: string; name: string }>;
}) {
  const [message, setMessage] = useState("");
  const [grantForm, setGrantForm] = useState({
    userId: "",
    moduleSlug: modules[0]?.slug ?? "",
    validityDays: "365",
  });

  async function updateStatus(
    accessId: string,
    accessStatus: string,
    validityDays?: number
  ) {
    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessId, accessStatus, validityDays }),
    });
    const data = await response.json();
    setMessage(data.error ?? "Acesso atualizado.");
    if (response.ok) window.location.reload();
  }

  async function grantAccess() {
    const response = await fetch("/api/admin/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: grantForm.userId,
        moduleSlug: grantForm.moduleSlug,
        validityDays: Number(grantForm.validityDays),
      }),
    });
    const data = await response.json();
    setMessage(data.error ?? "Acesso liberado.");
    if (response.ok) window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Gerenciamento de acessos</h1>
        <p className="section-subtitle">
          Libere, cancele ou reative acessos com validade configurável.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
          {message}
        </div>
      )}

      <div className="card grid gap-3 md:grid-cols-4">
        <input
          className="input-field"
          placeholder="ID do usuário"
          value={grantForm.userId}
          onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
        />
        <select
          className="input-field"
          value={grantForm.moduleSlug}
          onChange={(e) => setGrantForm({ ...grantForm, moduleSlug: e.target.value })}
        >
          {modules.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          className="input-field"
          type="number"
          value={grantForm.validityDays}
          onChange={(e) => setGrantForm({ ...grantForm, validityDays: e.target.value })}
        />
        <button type="button" onClick={grantAccess} className="btn-primary">
          Liberar acesso
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-divider text-ink-muted">
              <th className="px-3 py-2 text-left">Usuário</th>
              <th className="px-3 py-2 text-left">Módulo</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Validade</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {accesses.map((access) => (
              <tr key={access.id} className="border-b border-divider/70">
                <td className="px-3 py-3">
                  <p className="font-medium text-ink">{access.userName}</p>
                  <p className="text-ink-muted">{access.userEmail}</p>
                </td>
                <td className="px-3 py-3">{access.moduleName}</td>
                <td className="px-3 py-3">{access.accessStatus}</td>
                <td className="px-3 py-3 text-ink-muted">
                  {access.expiresAt
                    ? new Date(access.expiresAt).toLocaleDateString("pt-BR")
                    : "Sem expiração"}
                  {access.source && ` (${access.source})`}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => updateStatus(access.id, "active", 365)}
                    >
                      Reativar +365d
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => updateStatus(access.id, "canceled")}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => updateStatus(access.id, "blocked")}
                    >
                      Bloquear
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
