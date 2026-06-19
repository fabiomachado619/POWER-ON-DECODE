"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Erro ao alterar senha.");
    } else {
      setMessage("Senha alterada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    }
    setLoading(false);
  }

  return (
    <div className="page-shell">
      <main className="mx-auto max-w-md px-4 py-12">
        <Link href="/account" className="text-sm text-brand-dark hover:underline">
          ← Voltar para minha conta
        </Link>
        <h1 className="section-title mt-4">Alterar senha</h1>

        <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
          <input
            type="password"
            className="input-field"
            placeholder="Senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="input-field"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <input
            type="password"
            className="input-field"
            placeholder="Confirmar nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
          />
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
              {message}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </main>
    </div>
  );
}
