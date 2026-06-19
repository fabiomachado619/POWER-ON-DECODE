import type { Dictionary } from "@/i18n/pt-BR";

export function getDecodeProgressSteps(progress: Dictionary["progress"]) {
  return [
    { label: progress.validating, durationMs: 800 },
    { label: progress.checkingEeprom, durationMs: 900 },
    { label: progress.applyingDecode, durationMs: 1000 },
    { label: progress.verifying, durationMs: 800 },
    { label: progress.readyDownload, durationMs: 600 },
  ] as const;
}

export async function simulateDecodeProgress(
  steps: ReturnType<typeof getDecodeProgressSteps>,
  onStep: (label: string, progress: number) => void
): Promise<void> {
  const totalDuration = steps.reduce((sum, step) => sum + step.durationMs, 0);
  let elapsed = 0;

  for (const step of steps) {
    onStep(step.label, Math.round((elapsed / totalDuration) * 100));
    await new Promise((resolve) => setTimeout(resolve, step.durationMs));
    elapsed += step.durationMs;
  }

  onStep(steps[steps.length - 1].label, 100);
}
