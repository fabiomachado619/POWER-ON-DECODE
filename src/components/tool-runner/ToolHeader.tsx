interface ToolHeaderProps {
  title: string;
  description: string;
  badge?: string;
  backHref?: string;
  backLabel?: string;
}

export function ToolHeader({
  title,
  description,
  badge,
  backHref,
  backLabel,
}: ToolHeaderProps) {
  return (
    <div className="mb-8 mt-4">
      {backHref && backLabel && (
        <a href={backHref} className="btn-link">
          {backLabel}
        </a>
      )}
      {badge && <span className="badge-unlocked">{badge}</span>}
      <h1 className="mt-3 text-3xl font-black text-ink">{title}</h1>
      <p className="mt-2 text-ink-muted">{description}</p>
    </div>
  );
}
