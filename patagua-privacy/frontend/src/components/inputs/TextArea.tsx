type TextAreaProps = {
  label: string;
  name: string;
  value: string;
  required?: boolean;
  onChange: (name: string, value: string) => void;
};

export function TextArea({ label, name, value, required = false, onChange }: TextAreaProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        name={name}
        required={required}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  );
}
