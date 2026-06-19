"use client";

import Link from "next/link";
import type { ToolCatalogItem } from "@/types";
import { useI18n } from "@/components/LocaleProvider";

interface ProcedureListItemProps {
  tool: ToolCatalogItem;
}

export function ProcedureListItem({ tool }: ProcedureListItemProps) {
  const { t } = useI18n();
  const locked = !tool.hasAccess && !tool.isExpired;
  const expired = tool.isExpired;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-divider bg-surface p-5 shadow-elevated transition hover:border-brand/30 hover:shadow-elevated-lg md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-ink">{tool.name}</h3>
          {tool.hasAccess ? (
            <span className="badge-unlocked">{t.card.unlocked}</span>
          ) : expired ? (
            <span className="badge-expired">{t.card.expired}</span>
          ) : (
            <span className="badge-blocked">{t.card.blocked}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-muted">{tool.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="tag">{tool.typeLabel}</span>
          {tool.ecuName && <span className="tag">ECU: {tool.ecuName}</span>}
          {tool.eepromType && <span className="tag">EEPROM: {tool.eepromType}</span>}
        </div>
      </div>

      <div className="shrink-0">
        {tool.hasAccess && tool.toolRoute ? (
          <Link href={tool.toolRoute} className="btn-primary">
            {t.card.openTool}
          </Link>
        ) : expired ? (
          tool.purchaseUrl ? (
            <a
              href={tool.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-renew"
            >
              {t.card.renewAccess}
            </a>
          ) : (
            <button disabled className="btn-secondary">
              {t.common.soon}
            </button>
          )
        ) : locked ? (
          tool.purchaseUrl ? (
            <a
              href={tool.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              {t.card.buyAccess}
            </a>
          ) : (
            <button disabled className="btn-secondary">
              {t.common.soon}
            </button>
          )
        ) : (
          <button disabled className="btn-secondary">
            {t.common.soon}
          </button>
        )}
      </div>
    </div>
  );
}
