"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Erro ao redefinir senha.");
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="card w-full max-w-md shadow-elevated-lg">
        <h1 className="text-2xl font-bold text-ink">Nova senha</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Crie uma nova senha para sua conta.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            className="input-field"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <input
            type="password"
            className="input-field"
            placeholder="Confirmar senha"
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
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>

        <Link href="/login" className="btn-ghost mt-4 inline-flex text-sm">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
