interface DownloadResultProps {
  title: string;
  downloadUrl: string;
  downloadName: string;
  buttonLabel: string;
  suggestedNameLabel: string;
}

export function DownloadResult({
  title,
  downloadUrl,
  downloadName,
  buttonLabel,
  suggestedNameLabel,
}: DownloadResultProps) {
  return (
    <div className="card border-brand/30 bg-brand-muted/40">
      <p className="text-sm font-semibold text-brand-dark">{title}</p>
      <a href={downloadUrl} download={downloadName} className="btn-primary mt-4 inline-flex">
        {buttonLabel}
      </a>
      <p className="mt-2 text-xs text-ink-muted">
        {suggestedNameLabel}: {downloadName}
      </p>
    </div>
  );
}
