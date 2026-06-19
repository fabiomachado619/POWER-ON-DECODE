interface FinalInstructionsProps {
  title: string;
  instructions: string;
}

export function FinalInstructions({ title, instructions }: FinalInstructionsProps) {
  return (
    <div className="rounded-2xl border border-highlight/20 bg-blue-50 p-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
        {instructions}
      </pre>
    </div>
  );
}
