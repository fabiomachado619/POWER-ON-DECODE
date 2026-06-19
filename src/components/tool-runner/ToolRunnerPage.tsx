"use client";

import { FormEvent, useMemo, useState } from "react";
import { useI18n } from "@/components/LocaleProvider";
import { getDecodeProgressSteps } from "@/lib/decodeProgress";
import type { ToolRunnerViewModel } from "@/tools/serializable";
import { DownloadResult } from "./DownloadResult";
import { FileUploadBox } from "./FileUploadBox";
import { FinalInstructions } from "./FinalInstructions";
import { ProgressSteps } from "./ProgressSteps";
import { ResponsibilityCheckbox } from "./ResponsibilityCheckbox";
import { ToolInfoCard } from "./ToolInfoCard";
import { ToolReferenceImage } from "./ToolReferenceImage";

interface ToolRunnerPageProps {
  config: ToolRunnerViewModel;
}

export function ToolRunnerPage({ config }: ToolRunnerPageProps) {
  const { t } = useI18n();
  const progressSteps = useMemo(() => getDecodeProgressSteps(t.progress), [t]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [liabilityAccepted, setLiabilityAccepted] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");

  const infoItems = [
    {
      label: t.tool.manufacturer,
      value: config.manufacturer.charAt(0).toUpperCase() + config.manufacturer.slice(1),
    },
    { label: t.tool.ecu, value: config.ecuName },
    ...(config.eepromType
      ? [{ label: t.tool.eeprom, value: config.eepromType }]
      : []),
    ...(config.expectedSize
      ? [
          {
            label: t.tool.expectedSize,
            value: `${config.expectedSize} bytes`,
          },
        ]
      : []),
  ];

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
      formData.append("backupAccepted", "true");
      formData.append("responsibilityAccepted", "true");

      const response = await fetch(config.apiPath, {
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
      {config.referenceImageUrl && (
        <ToolReferenceImage
          src={config.referenceImageUrl}
          alt={config.referenceImageAlt ?? config.name}
          caption={config.referenceImageCaption}
        />
      )}

      <ToolInfoCard title={t.tool.procedureData} items={infoItems} />

      <form onSubmit={handleSubmit} className="card space-y-5">
        <FileUploadBox
          label={t.tool.uploadBin}
          selectedFile={selectedFile}
          selectedLabel={t.common.selected}
          onChange={(file) => {
            setSelectedFile(file);
            resetResult();
          }}
        />

        <ResponsibilityCheckbox
          checked={liabilityAccepted}
          onChange={setLiabilityAccepted}
          label={t.tool.liability}
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <ProgressSteps
          label={progressLabel}
          progress={progressValue}
          visible={processing || progressValue > 0}
        />

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
          <DownloadResult
            title={t.tool.procedureDone}
            downloadUrl={downloadUrl}
            downloadName={downloadName}
            buttonLabel={t.tool.downloadFile}
            suggestedNameLabel={t.common.suggestedName}
          />
          <FinalInstructions
            title={t.tool.postInstructions}
            instructions={t.postDecodeInstructions}
          />
        </div>
      )}
    </div>
  );
}
