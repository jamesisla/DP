type ToggleInputProps = {
  label: string;
  name: string;
  checked: boolean;
  onChange: (name: string, value: boolean) => void;
};

export function ToggleInput({ label, name, checked, onChange }: ToggleInputProps) {
  return (
    <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input className="h-5 w-5 accent-emerald-600" checked={checked} type="checkbox" onChange={(event) => onChange(name, event.target.checked)} />
    </label>
  );
}
