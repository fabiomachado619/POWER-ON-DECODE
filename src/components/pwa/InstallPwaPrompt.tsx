"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALLED_KEY = "pwa-installed";
const DISMISS_KEY = "pwa-dismissed-until";
const DISMISS_DAYS = 7;
const PROMPT_DELAY_MS = 5000;

interface PwaConfig {
  active: boolean;
  promptText?: string;
}

function isDismissedRecently(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const until = new Date(raw);
  return until.getTime() > Date.now();
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function InstallPwaPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [promptText, setPromptText] = useState(
    "Instale o Power On Decode no seu computador para acessar suas ferramentas com mais facilidade."
  );
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(INSTALLED_KEY) === "true") return;
    if (isStandaloneMode()) return;
    if (isDismissedRecently()) return;

    fetch("/api/pwa/config")
      .then((res) => res.json())
      .then((data: PwaConfig) => {
        if (!data.active) {
          setEnabled(false);
          return;
        }
        if (data.promptText) setPromptText(data.promptText);
      })
      .catch(() => undefined);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      window.setTimeout(() => {
        if (!isStandaloneMode() && !isDismissedRecently()) {
          setVisible(true);
        }
      }, PROMPT_DELAY_MS);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "true");
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    const until = new Date();
    until.setDate(until.getDate() + DISMISS_DAYS);
    localStorage.setItem(DISMISS_KEY, until.toISOString());
    setVisible(false);
  }

  if (!enabled || !visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-divider bg-surface p-4 shadow-elevated">
      <p className="text-sm text-ink">{promptText}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-primary text-sm" onClick={handleInstall}>
          Instalar aplicativo
        </button>
        <button type="button" className="btn-secondary text-sm" onClick={handleDismiss}>
          Agora não
        </button>
      </div>
    </div>
  );
}
