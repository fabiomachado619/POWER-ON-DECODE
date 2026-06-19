"use client";

import { FormEvent } from "react";
import { useState } from "react";

interface TemplateRow {
  id: string;
  slug: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  active: boolean;
}

const VARIABLES =
  "{{name}}, {{email}}, {{password}}, {{login_url}}, {{tool_name}}, {{expires_at}}, {{renewal_url}}";

export function AdminEmailTemplatesPanel({
  templates,
}: {
  templates: TemplateRow[];
}) {
  const [message, setMessage] = useState("");

  async function saveTemplate(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/admin/email-templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        subject: formData.get("subject"),
        bodyHtml: formData.get("bodyHtml"),
        bodyText: formData.get("bodyText"),
        active: formData.get("active") === "on",
      }),
    });
    const data = await response.json();
    setMessage(data.error ?? "Template salvo.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Templates de e-mail</h1>
        <p className="section-subtitle">
          Variáveis disponíveis: {VARIABLES}
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
          {message}
        </div>
      )}

      {templates.map((template) => (
        <form
          key={template.id}
          onSubmit={(e) => saveTemplate(e, template.id)}
          className="card space-y-4"
        >
          <div>
            <h2 className="text-lg font-semibold text-ink">{template.name}</h2>
            <p className="text-xs text-ink-muted">Slug: {template.slug}</p>
          </div>
          <input
            name="subject"
            defaultValue={template.subject}
            className="input-field"
            placeholder="Assunto"
          />
          <textarea
            name="bodyHtml"
            defaultValue={template.bodyHtml}
            className="input-field font-mono text-xs"
            rows={6}
          />
          <textarea
            name="bodyText"
            defaultValue={template.bodyText}
            className="input-field font-mono text-xs"
            rows={4}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={template.active} />
            Ativo
          </label>
          <button type="submit" className="btn-primary">
            Salvar template
          </button>
        </form>
      ))}
    </div>
  );
}
