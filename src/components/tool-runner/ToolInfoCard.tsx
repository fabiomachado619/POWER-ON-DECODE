interface ToolInfoItem {
  label: string;
  value: string;
}

interface ToolInfoCardProps {
  title: string;
  items: ToolInfoItem[];
}

export function ToolInfoCard({ title, items }: ToolInfoCardProps) {
  return (
    <div className="card border-brand/20">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-dark">
        {title}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-divider bg-canvas px-4 py-3"
          >
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-medium text-ink">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
