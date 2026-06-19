import Link from "next/link";
import type { ModuleInfo } from "@/types";

interface ModuleCardProps {
  module: ModuleInfo;
  purchaseUrl?: string;
}

export function ModuleCard({ module, purchaseUrl = "#" }: ModuleCardProps) {
  const locked = !module.hasAccess;

  return (
    <div className="card card-hover flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{module.name}</h3>
          <p className="mt-2 text-sm text-ink-muted">{module.description}</p>
        </div>
        {locked ? (
          <span className="badge-locked">Bloqueado</span>
        ) : (
          <span className="badge-unlocked">Liberado</span>
        )}
      </div>

      <div className="mt-auto pt-4">
        {locked ? (
          <a
            href={purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full"
          >
            Comprar acesso
          </a>
        ) : (
          <Link href={`/modules/${module.slug}`} className="btn-primary w-full">
            Abrir ferramenta
          </Link>
        )}
      </div>
    </div>
  );
}
