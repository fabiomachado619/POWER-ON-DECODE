interface LiabilityCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function LiabilityCheckbox({
  id,
  label,
  checked,
  onChange,
}: LiabilityCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand/20 bg-brand-muted/50 p-4"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-divider text-brand focus:ring-brand"
      />
      <span className="text-sm leading-relaxed text-ink">{label}</span>
    </label>
  );
}
