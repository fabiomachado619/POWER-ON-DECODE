"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CAMPAIGN_VARIABLES,
  DEFAULT_CAMPAIGN_HTML,
  DEFAULT_CAMPAIGN_SUBJECT,
  DEFAULT_CAMPAIGN_TEXT,
} from "@/lib/emailMarketingConstants";

interface ToolOption {
  slug: string;
  name: string;
}

interface CampaignRow {
  id: string;
  title: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  sentAt: string | null;
}

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Todos os usuários" },
  { value: "active", label: "Apenas usuários ativos" },
  { value: "expired", label: "Usuários com acesso vencido" },
  { value: "expiring_soon", label: "Usuários próximos do vencimento (30 dias)" },
  { value: "has_tool", label: "Usuários que possuem uma ferramenta específica" },
  {
    value: "missing_tool",
    label: "Usuários que NÃO possuem uma ferramenta específica",
  },
  { value: "category", label: "Usuários por categoria" },
] as const;

const CATEGORY_OPTIONS = [
  { value: "decode", label: "Decode" },
  { value: "reset", label: "Reset" },
  { value: "odometro", label: "Odômetro" },
  { value: "checksum", label: "Checksum" },
];

export function AdminEmailMarketingPanel({ tools }: { tools: ToolOption[] }) {
  const [title, setTitle] = useState("Nova campanha");
  const [subject, setSubject] = useState(DEFAULT_CAMPAIGN_SUBJECT);
  const [htmlContent, setHtmlContent] = useState(DEFAULT_CAMPAIGN_HTML);
  const [textContent, setTextContent] = useState(DEFAULT_CAMPAIGN_TEXT);
  const [audienceType, setAudienceType] = useState<string>("all");
  const [toolSlug, setToolSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("decode");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);

  async function loadCampaigns() {
    const response = await fetch("/api/admin/email-marketing");
    const data = await response.json();
    if (data.campaigns) setCampaigns(data.campaigns);
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function previewAudience() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/email-marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audienceType,
        toolSlug: toolSlug || null,
        categorySlug: audienceType === "category" ? categorySlug : null,
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (data.error) {
      setMessage(data.error);
      return;
    }
    setRecipientCount(data.count);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      previewAudience();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceType, toolSlug, categorySlug]);

  async function sendTest() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/email-marketing/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        htmlContent,
        textContent,
        toolSlug: toolSlug || null,
      }),
    });
    const data = await response.json();
    setLoading(false);
    setMessage(data.message ?? data.error ?? "Teste enviado.");
  }

  async function dispatchCampaign(event: FormEvent) {
    event.preventDefault();
    const count = recipientCount ?? 0;
    const confirmed = window.confirm(
      `Você confirma o envio para ${count} usuário${count === 1 ? "" : "s"}?`
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage("Enviando campanha em lotes...");

    let campaignId: string | undefined;
    let done = false;

    while (!done) {
      const response = await fetch("/api/admin/email-marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          htmlContent,
          textContent,
          audienceType,
          toolSlug: toolSlug || null,
          categorySlug: audienceType === "category" ? categorySlug : null,
          campaignId,
        }),
      });
      const data = await response.json();
      if (data.error) {
        setLoading(false);
        setMessage(data.error);
        return;
      }

      campaignId = data.campaignId;
      done = data.done;
      setMessage(
        `Progresso: ${data.sentCount ?? 0} enviados, ${data.failedCount ?? 0} falhas de ${data.totalRecipients ?? count}.`
      );

      if (!done && campaignId) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setLoading(false);
    setMessage("Campanha finalizada.");
    loadCampaigns();
  }

  const needsTool =
    audienceType === "has_tool" || audienceType === "missing_tool";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">E-mail Marketing</h1>
        <p className="section-subtitle">
          Envie comunicados para usuários cadastrados usando o SMTP configurado.
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          Variáveis: {CAMPAIGN_VARIABLES}
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
          {message}
        </div>
      )}

      <form onSubmit={dispatchCampaign} className="card space-y-4">
        <input
          className="input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da campanha"
          required
        />
        <input
          className="input-field"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Assunto do e-mail"
          required
        />
        <textarea
          className="input-field font-mono text-xs"
          rows={8}
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          placeholder="Conteúdo HTML"
          required
        />
        <textarea
          className="input-field font-mono text-xs"
          rows={6}
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Conteúdo texto simples"
          required
        />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-ink">Público-alvo</span>
            <select
              className="input-field"
              value={audienceType}
              onChange={(e) => setAudienceType(e.target.value)}
            >
              {AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {audienceType === "category" && (
            <label className="space-y-1 text-sm">
              <span className="font-medium text-ink">Categoria</span>
              <select
                className="input-field"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-ink">
              Filtro opcional por ferramenta (tool_slug)
            </span>
            <select
              className="input-field"
              value={toolSlug}
              onChange={(e) => setToolSlug(e.target.value)}
              required={needsTool}
            >
              <option value="">
                {needsTool ? "Selecione uma ferramenta" : "Nenhuma (opcional)"}
              </option>
              {tools.map((tool) => (
                <option key={tool.slug} value={tool.slug}>
                  {tool.name} ({tool.slug})
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-sm text-ink-muted">
          Destinatários estimados:{" "}
          <strong>{recipientCount ?? "..."}</strong>
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={sendTest}
            disabled={loading}
          >
            Enviar teste
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            Disparar campanha
          </button>
        </div>
      </form>

      <div className="card">
        <h2 className="text-lg font-semibold text-ink">Campanhas recentes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-ink-muted">
                <th className="py-2 pr-4">Título</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Destinatários</th>
                <th className="py-2 pr-4">Enviados</th>
                <th className="py-2 pr-4">Falhas</th>
                <th className="py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-divider/60">
                  <td className="py-2 pr-4">{campaign.title}</td>
                  <td className="py-2 pr-4">{campaign.status}</td>
                  <td className="py-2 pr-4">{campaign.totalRecipients}</td>
                  <td className="py-2 pr-4">{campaign.sentCount}</td>
                  <td className="py-2 pr-4">{campaign.failedCount}</td>
                  <td className="py-2">
                    {new Date(campaign.createdAt).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-ink-muted">
                    Nenhuma campanha registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
