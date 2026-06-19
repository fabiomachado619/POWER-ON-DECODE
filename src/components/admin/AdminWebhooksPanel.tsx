"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

interface ToolOption {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
}

interface WebhookRow {
  id: string;
  name: string;
  slug: string;
  publicUrl: string;
  active: boolean;
  description: string | null;
  toolSlugs: string[];
  toolsCount: number;
  eventsCount: number;
}

interface PublicUrlConfig {
  baseUrl: string;
  hostname: string | null;
  dnsResolvable: boolean;
  warning: string | null;
}

interface WebhookLogRow {
  id: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  externalProductId: string | null;
  productName: string | null;
  toolsReleased: string | null;
  externalEventId: string;
  processMessage: string | null;
  emailSent: boolean;
}

const CATEGORY_ORDER = ["decode", "reset", "odometro", "checksum"];

function slugifyWebhook(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function AdminWebhooksPanel({ tools }: { tools: ToolOption[] }) {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [publicUrlConfig, setPublicUrlConfig] = useState<PublicUrlConfig | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [editing, setEditing] = useState<WebhookRow | null>(null);
  const [logs, setLogs] = useState<WebhookLogRow[]>([]);
  const [logsTitle, setLogsTitle] = useState("");
  const [logsSlug, setLogsSlug] = useState("");
  const [toolSearch, setToolSearch] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    active: true,
    toolSlugs: [] as string[],
  });

  async function loadWebhooks() {
    const response = await fetch("/api/admin/webhooks");
    const data = await response.json();
    if (data.webhooks) setWebhooks(data.webhooks);
    if (data.publicUrlConfig) setPublicUrlConfig(data.publicUrlConfig);
  }

  useEffect(() => {
    loadWebhooks();
  }, []);

  useEffect(() => {
    if (!slugTouched && form.name) {
      setForm((current) => ({
        ...current,
        slug: slugifyWebhook(current.name),
      }));
    }
  }, [form.name, slugTouched]);

  const filteredTools = useMemo(() => {
    const query = toolSearch.trim().toLowerCase();
    if (!query) return tools;
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.slug.toLowerCase().includes(query) ||
        tool.categoryName.toLowerCase().includes(query)
    );
  }, [tools, toolSearch]);

  const groupedTools = useMemo(() => {
    const groups = new Map<string, ToolOption[]>();
    for (const slug of CATEGORY_ORDER) groups.set(slug, []);
    for (const tool of filteredTools) {
      const list = groups.get(tool.categorySlug) ?? [];
      list.push(tool);
      groups.set(tool.categorySlug, list);
    }
    return groups;
  }, [filteredTools]);

  const previewUrl = form.slug
    ? `${publicUrlConfig?.baseUrl ?? ""}/api/webhooks/custom/${slugifyWebhook(form.slug)}`
    : "";

  function openCreate() {
    setEditing(null);
    setSlugTouched(false);
    setForm({ name: "", slug: "", description: "", active: true, toolSlugs: [] });
    setToolSearch("");
    setEditorOpen(true);
  }

  function openEdit(webhook: WebhookRow) {
    setEditing(webhook);
    setSlugTouched(true);
    setForm({
      name: webhook.name,
      slug: webhook.slug,
      description: webhook.description ?? "",
      active: webhook.active,
      toolSlugs: webhook.toolSlugs,
    });
    setToolSearch("");
    setEditorOpen(true);
  }

  function toggleToolSlug(slug: string) {
    setForm((current) => ({
      ...current,
      toolSlugs: current.toolSlugs.includes(slug)
        ? current.toolSlugs.filter((item) => item !== slug)
        : [...current.toolSlugs, slug],
    }));
  }

  async function saveWebhook(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      name: form.name,
      slug: slugifyWebhook(form.slug),
      description: form.description,
      active: form.active,
      toolSlugs: form.toolSlugs,
    };

    const response = await fetch(
      editing ? `/api/admin/webhooks/${editing.id}` : "/api/admin/webhooks",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    setLoading(false);

    if (data.error) {
      setMessage(data.error);
      return;
    }

    setMessage(
      editing
        ? "Webhook atualizado. Copie o link e cole na plataforma de pagamento."
        : "Webhook criado. Copie o link e cole na plataforma de pagamento."
    );
    setEditorOpen(false);
    await loadWebhooks();
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setMessage("Link copiado. Cole este endereço na plataforma de pagamento.");
  }

  async function testWebhook(id: string) {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/webhooks/${id}/test`, {
      method: "POST",
    });
    const data = await response.json();
    setLoading(false);
    setMessage(
      data.note
        ? `${data.message ?? "Teste interno concluído."} ${data.note}`
        : data.message ?? data.error ?? "Teste executado."
    );
    await loadWebhooks();
  }

  async function openLogs(webhook: WebhookRow) {
    setLoading(true);
    const response = await fetch(`/api/admin/webhooks/${webhook.id}`);
    const data = await response.json();
    setLoading(false);
    if (data.error) {
      setMessage(data.error);
      return;
    }
    setLogs(data.logs ?? []);
    setLogsTitle(webhook.name);
    setLogsSlug(webhook.slug);
    setLogsOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Webhooks</h1>
          <p className="section-subtitle">
            Cadastre webhooks por nome e slug amigável. Copie o link público e
            cole na plataforma de pagamento para liberar ferramentas
            automaticamente.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          Novo webhook
        </button>
      </div>

      {publicUrlConfig?.warning && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Atenção — domínio público:</strong> {publicUrlConfig.warning}
          <p className="mt-2 text-xs">
            Base configurada: <code>{publicUrlConfig.baseUrl}</code>. Ajuste{" "}
            <code>APP_URL</code> ou <code>WEBHOOK_PUBLIC_BASE_URL</code> no{" "}
            <code>.env</code> da VPS e configure o DNS antes de testar na
            plataforma de pagamento.
          </p>
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {webhooks.map((webhook) => {
          const expanded = expandedId === webhook.id;
          return (
            <div key={webhook.id} className="card overflow-hidden p-0">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setExpandedId(expanded ? null : webhook.id)}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-ink">
                      {webhook.name}
                    </h2>
                    <span
                      className={
                        webhook.active ? "badge-unlocked" : "badge-blocked"
                      }
                    >
                      {webhook.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    Slug: <code>{webhook.slug}</code> · {webhook.toolsCount}{" "}
                    ferramenta{webhook.toolsCount === 1 ? "" : "s"} ·{" "}
                    {webhook.eventsCount} evento
                    {webhook.eventsCount === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="text-sm text-ink-muted">
                  {expanded ? "▲" : "▼"}
                </span>
              </button>

              {expanded && (
                <div className="border-t border-divider px-5 py-4">
                  <p className="text-xs font-medium text-ink">Link do webhook</p>
                  <p className="mt-1 break-all text-sm text-ink-muted">
                    {webhook.publicUrl}
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Ferramentas: {webhook.toolSlugs.join(", ") || "—"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-secondary text-sm"
                      onClick={() => copyLink(webhook.publicUrl)}
                    >
                      Copiar link
                    </button>
                    <button
                      type="button"
                      className="btn-secondary text-sm"
                      onClick={() => openEdit(webhook)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-secondary text-sm"
                      onClick={() => testWebhook(webhook.id)}
                      disabled={loading}
                    >
                      Testar
                    </button>
                    <button
                      type="button"
                      className="btn-secondary text-sm"
                      onClick={() => openLogs(webhook)}
                    >
                      Ver logs
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {webhooks.length === 0 && (
          <div className="empty-state">Nenhum webhook cadastrado.</div>
        )}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={saveWebhook}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-divider bg-surface p-6 shadow-elevated"
          >
            <h2 className="text-lg font-semibold text-ink">
              {editing ? "Editar webhook" : "Novo webhook"}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Após salvar, copie o link e cole na plataforma de pagamento.
            </p>

            <div className="mt-4 space-y-4">
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome do webhook"
                required
              />
              <div>
                <input
                  className="input-field"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm({
                      ...form,
                      slug: slugifyWebhook(e.target.value),
                    });
                  }}
                  placeholder="Slug amigável (ex: venda-ssangyong-decode)"
                  required
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Use apenas letras minúsculas, números e hífens.
                </p>
              </div>
              {previewUrl && (
                <div className="rounded-xl border border-divider bg-canvas px-4 py-3">
                  <p className="text-xs text-ink-muted">Link do webhook</p>
                  <p className="mt-1 break-all text-sm text-ink">{previewUrl}</p>
                  {!publicUrlConfig?.dnsResolvable && (
                    <p className="mt-2 text-xs text-amber-700">
                      Este domínio ainda não resolve no DNS. Plataformas externas
                      retornarão erro cURL 6 até o DNS apontar para a VPS.
                    </p>
                  )}
                </div>
              )}
              <textarea
                className="input-field"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descrição"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                />
                Webhook ativo
              </label>

              <div>
                <p className="mb-2 text-sm font-medium text-ink">
                  Ferramentas vinculadas
                </p>
                <input
                  className="input-field mb-3"
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  placeholder="Buscar ferramenta..."
                />
                <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-divider p-4">
                  {CATEGORY_ORDER.map((categorySlug) => {
                    const items = groupedTools.get(categorySlug) ?? [];
                    if (items.length === 0) return null;
                    return (
                      <div key={categorySlug}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-dark">
                          {items[0]?.categoryName ?? categorySlug}
                        </p>
                        <div className="space-y-2">
                          {items.map((tool) => (
                            <label
                              key={tool.slug}
                              className="flex items-start gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={form.toolSlugs.includes(tool.slug)}
                                onChange={() => toggleToolSlug(tool.slug)}
                                className="mt-1"
                              />
                              <span>
                                <strong>{tool.name}</strong>
                                <span className="block text-xs text-ink-muted">
                                  {tool.slug}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || form.toolSlugs.length === 0 || !form.slug}
              >
                Salvar
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditorOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {logsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-divider bg-surface p-6 shadow-elevated">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  Logs — {logsTitle}
                </h2>
                <p className="text-sm text-ink-muted">
                  Slug: <code>{logsSlug}</code>
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => setLogsOpen(false)}
              >
                Fechar
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-divider text-ink-muted">
                    <th className="px-3 py-2 text-left">Data</th>
                    <th className="px-3 py-2 text-left">Cliente</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Produto</th>
                    <th className="px-3 py-2 text-left">Ferramentas</th>
                    <th className="px-3 py-2 text-left">Transação</th>
                    <th className="px-3 py-2 text-left">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-divider/70">
                      <td className="px-3 py-3 text-ink-muted">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-3 py-3">
                        <p>{log.customerName ?? "—"}</p>
                        <p className="text-ink-muted">{log.customerEmail ?? "—"}</p>
                      </td>
                      <td className="px-3 py-3">{log.status}</td>
                      <td className="px-3 py-3">
                        <p>{log.externalProductId ?? "—"}</p>
                        <p className="text-ink-muted">{log.productName ?? "—"}</p>
                      </td>
                      <td className="px-3 py-3">{log.toolsReleased ?? "—"}</td>
                      <td className="px-3 py-3 text-xs text-ink-muted">
                        {log.externalEventId}
                      </td>
                      <td className="px-3 py-3 text-ink-muted">
                        {log.processMessage ?? "—"}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-ink-muted">
                        Nenhum log registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
