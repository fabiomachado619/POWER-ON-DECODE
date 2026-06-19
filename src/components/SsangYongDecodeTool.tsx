"use client";

import { FormEvent, useMemo, useState } from "react";
import { LiabilityCheckbox } from "@/components/LiabilityCheckbox";
import { useI18n } from "@/components/LocaleProvider";
import { ProgressBar } from "@/components/ProgressBar";
import { getDecodeProgressSteps } from "@/lib/decodeProgress";

interface ProcedureOption {
  slug: string;
  name: string;
  eepromType: string;
  expectedSize: number;
  offsetHex: string;
  ecuName?: string;
  manufacturerName?: string;
}

interface SsangYongDecodeToolProps {
  procedures: ProcedureOption[];
}

export function SsangYongDecodeTool({ procedures }: SsangYongDecodeToolProps) {
  const { t } = useI18n();
  const progressSteps = useMemo(() => getDecodeProgressSteps(t.progress), [t]);

  const [procedureSlug, setProcedureSlug] = useState(
    procedures[0]?.slug ?? ""
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [liabilityAccepted, setLiabilityAccepted] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");

  const selectedProcedure = useMemo(
    () => procedures.find((procedure) => procedure.slug === procedureSlug),
    [procedureSlug, procedures]
  );

  function resetResult() {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl(null);
    setDownloadName("");
    setCompleted(false);
    setProgressLabel("");
    setProgressValue(0);
    setError("");
  }

  async function simulateProgress(
    onStep: (label: string, progress: number) => void
  ) {
    const totalDuration = progressSteps.reduce(
      (sum, step) => sum + step.durationMs,
      0
    );
    let elapsed = 0;
    for (const step of progressSteps) {
      onStep(step.label, Math.round((elapsed / totalDuration) * 100));
      await new Promise((resolve) => setTimeout(resolve, step.durationMs));
      elapsed += step.durationMs;
    }
    onStep(t.progress.readyDownload, 100);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetResult();

    if (!selectedFile) {
      setError(t.tool.selectBin);
      return;
    }

    if (!liabilityAccepted) {
      setError(t.tool.confirmBackup);
      return;
    }

    setProcessing(true);
    setProgressLabel(t.progress.validating);
    setProgressValue(5);

    try {
      const progressPromise = simulateProgress((label, progress) => {
        setProgressLabel(label);
        setProgressValue(progress);
      });

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("procedureSlug", procedureSlug);
      formData.append("backupAccepted", "true");
      formData.append("responsibilityAccepted", "true");

      const response = await fetch("/api/decode/ssangyong", {
        method: "POST",
        body: formData,
      });

      await progressPromise;

      if (!response.ok) {
        const data = await response.json();
        const details = Array.isArray(data.details)
          ? data.details.join(" ")
          : "";
        throw new Error([data.error, details].filter(Boolean).join(" "));
      }

      const blob = await response.blob();
      const suggestedName =
        response.headers.get("X-Download-Filename") ??
        selectedFile.name.replace(/\.bin$/i, "_DECODE_OFF.bin");

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(suggestedName);
      setCompleted(true);
      setProgressLabel(t.progress.readyDownload);
      setProgressValue(100);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t.tool.processError
      );
      setProgressLabel("");
      setProgressValue(0);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      {selectedProcedure && (
        <div className="card border-brand/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-dark">
            {t.tool.procedureData}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoItem
              label={t.tool.manufacturer}
              value={selectedProcedure.manufacturerName ?? "SsangYong"}
            />
            <InfoItem label={t.tool.ecu} value={selectedProcedure.ecuName ?? "—"} />
            <InfoItem label={t.tool.eeprom} value={selectedProcedure.eepromType} />
            <InfoItem
              label={t.tool.expectedSize}
              value={`${selectedProcedure.expectedSize} bytes`}
            />
            <InfoItem
              label={t.tool.offsetApplied}
              value={selectedProcedure.offsetHex}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label htmlFor="procedure" className="mb-2 block text-sm font-medium text-ink">
            {t.tool.procedure}
          </label>
          <select
            id="procedure"
            value={procedureSlug}
            onChange={(event) => {
              setProcedureSlug(event.target.value);
              resetResult();
            }}
            className="input-field"
          >
            {procedures.map((procedure) => (
              <option key={procedure.slug} value={procedure.slug}>
                {procedure.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="binFile" className="mb-2 block text-sm font-medium text-ink">
            {t.tool.uploadBin}
          </label>
          <div className="rounded-2xl border border-dashed border-divider bg-canvas p-5 transition hover:border-brand/40">
            <input
              id="binFile"
              type="file"
              accept=".bin,application/octet-stream"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                resetResult();
              }}
              className="block w-full text-sm text-ink-muted file:mr-4 file:rounded-xl file:border-0 file:bg-brand file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
            />
            {selectedFile && (
              <p className="mt-3 text-xs text-ink-muted">
                {t.common.selected}: {selectedFile.name} ({selectedFile.size} bytes)
              </p>
            )}
          </div>
        </div>

        <LiabilityCheckbox
          id="liabilityAccepted"
          checked={liabilityAccepted}
          onChange={setLiabilityAccepted}
          label={t.tool.liability}
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {(processing || progressValue > 0) && (
          <ProgressBar label={progressLabel} progress={progressValue} />
        )}

        <button
          type="submit"
          disabled={processing}
          className="btn-primary w-full py-3 text-base"
        >
          {processing ? t.common.processing : t.tool.applyDecode}
        </button>
      </form>

      {completed && downloadUrl && (
        <div className="space-y-4">
          <div className="card border-brand/30 bg-brand-muted/40">
            <p className="text-sm font-semibold text-brand-dark">
              {t.tool.procedureDone}
            </p>
            <a
              href={downloadUrl}
              download={downloadName}
              className="btn-primary mt-4 inline-flex"
            >
              {t.tool.downloadFile}
            </a>
            <p className="mt-2 text-xs text-ink-muted">
              {t.common.suggestedName}: {downloadName}
            </p>
          </div>

          <div className="rounded-2xl border border-highlight/20 bg-blue-50 p-5">
            <h3 className="text-sm font-semibold text-ink">
              {t.tool.postInstructions}
            </h3>
            <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
              {t.postDecodeInstructions}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-divider bg-canvas px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
