"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/LocaleProvider";
import { canAccessAdminArea } from "@/lib/roles";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? t.login.submit);
        return;
      }

      const destination =
        canAccessAdminArea(data.user?.role ?? "customer") &&
        redirectTo === "/dashboard"
          ? "/admin"
          : redirectTo;
      router.push(destination);
      router.refresh();
    } catch {
      setError(t.login.errorConnection);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
          {t.login.email}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input-field"
          placeholder={t.login.emailPlaceholder}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
          {t.login.password}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input-field"
          placeholder="••••••••"
          required
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-brand-dark hover:underline">
          {t.login.forgotPassword}
        </Link>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? t.login.entering : t.login.submit}
      </button>
    </form>
  );
}

export default function LoginPage() {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="absolute inset-0 bg-login-pattern" />
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface shadow-elevated ring-1 ring-divider">
            <span className="text-2xl font-black text-brand">PO</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-ink">
            POWER ON <span className="text-brand">DECODE</span>
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{t.nav.tagline}</p>
        </div>

        <div className="card shadow-elevated-lg">
          <Suspense
            fallback={
              <div className="py-8 text-center text-sm text-ink-muted">
                {t.common.loading}
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
          {t.login.footer}
        </p>
      </div>
    </div>
  );
}
