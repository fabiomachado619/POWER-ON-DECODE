"use client";

interface ProgressBarProps {
  label: string;
  progress: number;
}

const STEPS = [
  "Validando arquivo…",
  "Conferindo EEPROM…",
  "Aplicando decode…",
  "Verificando resultado…",
  "Arquivo pronto para download.",
];

export function ProgressBar({ label, progress }: ProgressBarProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  const activeStepIndex = STEPS.findIndex((step) => step === label);

  return (
    <div className="rounded-2xl border border-divider bg-brand-muted/40 p-5">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-medium text-brand-dark">{label}</span>
        <span className="font-bold text-ink">{safeProgress}%</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-canvas ring-1 ring-divider">
        <div
          className="relative h-full rounded-full bg-gradient-to-r from-brand-dark via-brand to-brand transition-all duration-500"
          style={{ width: `${safeProgress}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {STEPS.map((step, index) => {
          const isDone =
            activeStepIndex > index ||
            (activeStepIndex === index && safeProgress >= 100);
          const isActive = step === label;

          return (
            <div
              key={step}
              className={`rounded-lg px-3 py-2 text-xs ${
                isActive
                  ? "bg-brand-light font-medium text-brand-dark"
                  : isDone
                    ? "bg-canvas text-ink-muted"
                    : "text-ink-muted/60"
              }`}
            >
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
