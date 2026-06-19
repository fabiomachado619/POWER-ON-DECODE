import Link from "next/link";
import type { ReactNode } from "react";

interface ToolAccessGuardProps {
  allowed: boolean;
  reason?: string;
  purchaseUrl?: string;
  dashboardHref?: string;
  dashboardLabel?: string;
  buyLabel?: string;
  children: ReactNode;
}

export function ToolAccessGuard({
  allowed,
  reason,
  purchaseUrl,
  dashboardHref = "/dashboard",
  dashboardLabel = "Voltar ao painel",
  buyLabel = "Comprar acesso",
  children,
}: ToolAccessGuardProps) {
  if (allowed) {
    return <>{children}</>;
  }

  return (
    <div className="card border-orange-200 bg-orange-50">
      <p className="text-sm font-semibold text-orange-900">
        Acesso indisponível para esta ferramenta.
      </p>
      {reason && <p className="mt-2 text-sm text-orange-800">{reason}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={dashboardHref} className="btn-secondary">
          {dashboardLabel}
        </Link>
        {purchaseUrl && (
          <a
            href={purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            {buyLabel}
          </a>
        )}
      </div>
    </div>
  );
}
