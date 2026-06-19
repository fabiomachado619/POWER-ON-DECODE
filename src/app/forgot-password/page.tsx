"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setMessage(data.message ?? data.error ?? "Erro ao processar.");
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="card w-full max-w-md shadow-elevated-lg">
        <h1 className="text-2xl font-bold text-ink">Esqueci minha senha</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Informe seu e-mail para receber o link de redefinição (válido por 1 hora).
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            className="input-field"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {message && (
            <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-sm text-brand-dark">
              {message}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Enviando..." : "Enviar link"}
          </button>
        </form>

        <Link href="/login" className="btn-ghost mt-4 inline-flex text-sm">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
