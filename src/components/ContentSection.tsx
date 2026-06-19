import Link from "next/link";
import { ReactNode } from "react";

interface ContentSectionProps {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function ContentSection({
  title,
  subtitle,
  actionHref,
  actionLabel,
  children,
  emptyMessage,
  isEmpty,
}: ContentSectionProps) {
  return (
    <section className="mb-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {actionHref && actionLabel && (
          <Link href={actionHref} className="btn-link">
            {actionLabel} →
          </Link>
        )}
      </div>

      {isEmpty ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        children
      )}
    </section>
  );
}
