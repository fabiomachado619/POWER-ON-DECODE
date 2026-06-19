import { ProgressBar } from "@/components/ProgressBar";

interface ProgressStepsProps {
  label: string;
  progress: number;
  visible?: boolean;
}

export function ProgressSteps({ label, progress, visible = true }: ProgressStepsProps) {
  if (!visible || progress <= 0) return null;
  return <ProgressBar label={label} progress={progress} />;
}
