interface ResponsibilityCheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function ResponsibilityCheckbox({
  id = "responsibilityAccepted",
  checked,
  onChange,
  label,
}: ResponsibilityCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-divider bg-canvas px-4 py-3"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-divider text-brand focus:ring-brand"
      />
      <span className="text-sm leading-relaxed text-ink-muted">{label}</span>
    </label>
  );
}
