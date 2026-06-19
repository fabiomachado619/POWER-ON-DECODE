interface FileUploadBoxProps {
  id?: string;
  label: string;
  accept?: string;
  selectedFile: File | null;
  selectedLabel?: string;
  onChange: (file: File | null) => void;
}

export function FileUploadBox({
  id = "toolFile",
  label,
  accept = ".bin,application/octet-stream",
  selectedFile,
  selectedLabel,
  onChange,
}: FileUploadBoxProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="rounded-2xl border border-dashed border-divider bg-canvas p-5 transition hover:border-brand/40">
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-ink-muted file:mr-4 file:rounded-xl file:border-0 file:bg-brand file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
        />
        {selectedFile && selectedLabel && (
          <p className="mt-3 text-xs text-ink-muted">
            {selectedLabel}: {selectedFile.name} ({selectedFile.size} bytes)
          </p>
        )}
      </div>
    </div>
  );
}
