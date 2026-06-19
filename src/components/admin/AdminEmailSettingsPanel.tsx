"use client";

import { FormEvent, useState } from "react";

interface EmailSettingsForm {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFromName: string;
  smtpFromEmail: string;
  smtpSecure: boolean;
}

export function AdminEmailSettingsPanel({
  initial,
}: {
  initial: EmailSettingsForm;
}) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/email-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        smtpPort: Number(form.smtpPort),
      }),
    });
    const data = await response.json();
    setMessage(data.error ?? "Configurações SMTP salvas.");
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Configurações SMTP</h1>
        <p className="section-subtitle">
          Salvo no banco com fallback para variáveis de ambiente.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card grid gap-4 md:grid-cols-2">
        <input
          className="input-field"
          placeholder="SMTP Host"
          value={form.smtpHost}
          onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
          required
        />
        <input
          className="input-field"
          placeholder="SMTP Port"
          value={form.smtpPort}
          onChange={(e) => setForm({ ...form, smtpPort: e.target.value })}
          required
        />
        <input
          className="input-field"
          placeholder="SMTP User"
          value={form.smtpUser}
          onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
        />
        <input
          className="input-field"
          type="password"
          placeholder="SMTP Password"
          value={form.smtpPassword}
          onChange={(e) => setForm({ ...form, smtpPassword: e.target.value })}
        />
        <input
          className="input-field"
          placeholder="From Name"
          value={form.smtpFromName}
          onChange={(e) => setForm({ ...form, smtpFromName: e.target.value })}
          required
        />
        <input
          className="input-field"
          type="email"
          placeholder="From Email"
          value={form.smtpFromEmail}
          onChange={(e) => setForm({ ...form, smtpFromEmail: e.target.value })}
          required
        />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={form.smtpSecure}
            onChange={(e) => setForm({ ...form, smtpSecure: e.target.checked })}
          />
          SMTP Secure (TLS)
        </label>
        <button type="submit" disabled={loading} className="btn-primary md:col-span-2">
          {loading ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>
    </div>
  );
}
