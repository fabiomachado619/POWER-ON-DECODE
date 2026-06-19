"use client";

import { FormEvent, useEffect, useState } from "react";

interface PwaSettingsForm {
  appName: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  promptText: string;
  active: boolean;
}

export function AdminPwaSettingsPanel() {
  const [settings, setSettings] = useState<PwaSettingsForm | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/pwa-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      });
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;

    const response = await fetch("/api/admin/pwa-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await response.json();
    setMessage(data.error ?? "Configurações PWA salvas.");
    if (data.settings) setSettings(data.settings);
  }

  if (!settings) {
    return <p className="text-sm text-ink-muted">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Configurações PWA</h1>
        <p className="section-subtitle">
          Personalize o aplicativo instalável e o pop-up de instalação.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
          {message}
        </div>
      )}

      <form onSubmit={saveSettings} className="card space-y-4">
        <input
          className="input-field"
          value={settings.appName}
          onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
          placeholder="Nome do app"
          required
        />
        <input
          className="input-field"
          value={settings.shortName}
          onChange={(e) =>
            setSettings({ ...settings, shortName: e.target.value })
          }
          placeholder="Short name"
          required
        />
        <textarea
          className="input-field"
          rows={3}
          value={settings.description}
          onChange={(e) =>
            setSettings({ ...settings, description: e.target.value })
          }
          placeholder="Descrição"
          required
        />
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="input-field"
            value={settings.themeColor}
            onChange={(e) =>
              setSettings({ ...settings, themeColor: e.target.value })
            }
            placeholder="Cor tema (#10B981)"
            required
          />
          <input
            className="input-field"
            value={settings.backgroundColor}
            onChange={(e) =>
              setSettings({ ...settings, backgroundColor: e.target.value })
            }
            placeholder="Cor de fundo (#F5F7FA)"
            required
          />
        </div>
        <textarea
          className="input-field"
          rows={3}
          value={settings.promptText}
          onChange={(e) =>
            setSettings({ ...settings, promptText: e.target.value })
          }
          placeholder="Texto do pop-up de instalação"
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.active}
            onChange={(e) =>
              setSettings({ ...settings, active: e.target.checked })
            }
          />
          Pop-up PWA ativo
        </label>
        <button type="submit" className="btn-primary">
          Salvar configurações
        </button>
      </form>
    </div>
  );
}
