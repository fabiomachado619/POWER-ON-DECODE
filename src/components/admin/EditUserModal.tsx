"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type TabId = "dados" | "acessos" | "liberar";

interface UserAccessRow {
  id: string;
  userModuleId: string;
  moduleName: string;
  primaryToolName: string;
  primaryCategoryName: string;
  toolNames: string[];
  categoryNames: string[];
  displayStatus: string;
  startsAt: string | null;
  expiresAt: string | null;
}

interface AvailableToolRow {
  slug: string;
  name: string;
  categoryName: string;
  manufacturerName: string;
  moduleName: string;
  alreadyGranted: boolean;
}

interface UserDetailsResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    roleLabel: string;
    status: string;
  };
  accesses: UserAccessRow[];
  availableTools: AvailableToolRow[];
  permissions: {
    canEditRole: boolean;
    canEditEmail: boolean;
  };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "ativo":
      return "badge-unlocked";
    case "vencido":
      return "badge-expired";
    case "bloqueado":
    case "cancelado":
      return "badge-locked";
    default:
      return "tag";
  }
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.829-2.828z" />
    </svg>
  );
}

export function EditUserModal({
  userId,
  onClose,
  onUpdated,
}: {
  userId: string;
  onClose: () => void;
  onUpdated: (message: string) => void;
}) {
  const [tab, setTab] = useState<TabId>("dados");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<UserDetailsResponse | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    role: "customer",
  });
  const [toolSearch, setToolSearch] = useState("");
  const [selectedToolSlugs, setSelectedToolSlugs] = useState<string[]>([]);
  const [validityDays, setValidityDays] = useState("365");
  const [sendEmail, setSendEmail] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Erro ao carregar usuário.");
        }
        setDetails(data);
        setProfileForm({
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  const filteredTools = useMemo(() => {
    if (!details) return [];
    const query = toolSearch.trim().toLowerCase();
    if (!query) return details.availableTools;
    return details.availableTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.categoryName.toLowerCase().includes(query) ||
        tool.manufacturerName.toLowerCase().includes(query) ||
        tool.moduleName.toLowerCase().includes(query)
    );
  }, [details, toolSearch]);

  async function reloadDetails() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Erro ao carregar usuário.");
      }
      setDetails(data);
      setProfileForm({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Erro ao salvar usuário.");
      }
      onUpdated("Dados do usuário atualizados.");
      await reloadDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  async function updateAccess(userModuleId: string, action: string) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/users/${userId}/update-access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userModuleId, action }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Erro ao atualizar acesso.");
      }
      onUpdated("Acesso atualizado.");
      await reloadDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  async function grantSelectedTools() {
    if (selectedToolSlugs.length === 0) {
      setError("Selecione ao menos uma ferramenta.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/users/${userId}/grant-access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolSlugs: selectedToolSlugs,
            validityDays: Number(validityDays),
            sendEmail,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Erro ao liberar acesso.");
      }
      setSelectedToolSlugs([]);
      onUpdated(
        data.emailSent
          ? "Acessos liberados e e-mail enviado."
          : "Acessos liberados."
      );
      await reloadDetails();
      setTab("acessos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  function toggleToolSlug(slug: string) {
    setSelectedToolSlugs((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-surface shadow-elevated">
        <div className="flex items-start justify-between border-b border-divider px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Editar usuário</h2>
            {details && (
              <p className="mt-1 text-sm text-ink-muted">
                {details.user.name} — {details.user.email}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-3 py-2"
          >
            Fechar
          </button>
        </div>

        <div className="flex gap-2 border-b border-divider px-6 py-3">
          {(
            [
              ["dados", "Dados"],
              ["acessos", "Acessos"],
              ["liberar", "Liberar acesso"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                tab === id
                  ? "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-lg px-4 py-2 text-sm font-medium text-ink-muted hover:bg-canvas"
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="text-sm text-ink-muted">Carregando...</p>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : !details ? (
            <p className="text-sm text-ink-muted">Usuário não encontrado.</p>
          ) : tab === "dados" ? (
            <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Nome
                </label>
                <input
                  className="input-field"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  E-mail
                </label>
                <input
                  className="input-field"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  required
                  disabled={!details.permissions.canEditEmail}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Perfil
                </label>
                <select
                  className="input-field"
                  value={profileForm.role}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, role: e.target.value })
                  }
                  disabled={!details.permissions.canEditRole}
                >
                  <option value="customer">Cliente</option>
                  <option value="admin">Administrador</option>
                  {details.permissions.canEditRole && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Status
                </label>
                <div className="input-field bg-canvas text-ink-muted">
                  {details.user.status}
                </div>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? "Salvando..." : "Salvar dados"}
                </button>
              </div>
            </form>
          ) : tab === "acessos" ? (
            <div className="space-y-4">
              {details.accesses.length === 0 ? (
                <div className="empty-state">
                  Este usuário ainda não possui acessos liberados.
                </div>
              ) : (
                details.accesses.map((access) => (
                  <div key={access.id} className="card space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">
                          {access.primaryToolName}
                        </p>
                        <p className="text-sm text-ink-muted">
                          {access.categoryNames.join(", ") || access.primaryCategoryName}
                        </p>
                        {access.toolNames.length > 1 && (
                          <p className="mt-1 text-xs text-ink-muted">
                            Ferramentas: {access.toolNames.join(", ")}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-ink-muted">
                          Módulo: {access.moduleName}
                        </p>
                      </div>
                      <span className={statusBadgeClass(access.displayStatus)}>
                        {access.displayStatus}
                      </span>
                    </div>

                    <div className="grid gap-2 text-sm text-ink-muted md:grid-cols-2">
                      <p>Início: {formatDate(access.startsAt)}</p>
                      <p>Vencimento: {formatDate(access.expiresAt)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => updateAccess(access.userModuleId, "block")}
                        className="btn-secondary"
                      >
                        Bloquear
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          updateAccess(access.userModuleId, "reactivate")
                        }
                        className="btn-secondary"
                      >
                        Reativar
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => updateAccess(access.userModuleId, "cancel")}
                        className="btn-secondary"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => updateAccess(access.userModuleId, "renew")}
                        className="btn-secondary"
                      >
                        Renovar +365 dias
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => updateAccess(access.userModuleId, "remove")}
                        className="btn-secondary"
                      >
                        Remover acesso
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  className="input-field md:col-span-2"
                  placeholder="Buscar ferramenta, categoria ou montadora"
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                />
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  placeholder="Validade em dias"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                Enviar e-mail avisando sobre novo acesso liberado
              </label>

              <div className="max-h-[360px] overflow-y-auto rounded-xl border border-divider">
                {filteredTools.length === 0 ? (
                  <div className="empty-state">Nenhuma ferramenta encontrada.</div>
                ) : (
                  filteredTools.map((tool) => (
                    <label
                      key={tool.slug}
                      className="flex cursor-pointer items-start gap-3 border-b border-divider/70 px-4 py-3 last:border-b-0 hover:bg-canvas"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedToolSlugs.includes(tool.slug)}
                        onChange={() => toggleToolSlug(tool.slug)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-ink">
                          {tool.name}
                        </span>
                        <span className="block text-sm text-ink-muted">
                          {tool.categoryName} — {tool.manufacturerName}
                        </span>
                        <span className="block text-xs text-ink-muted">
                          Módulo: {tool.moduleName}
                          {tool.alreadyGranted ? " • já liberado" : ""}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={grantSelectedTools}
                className="btn-primary"
              >
                {saving
                  ? "Liberando..."
                  : `Liberar selecionadas (${selectedToolSlugs.length})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { PencilIcon };
