type SelectInputProps = {
  label: string;
  name: string;
  value: string;
  required?: boolean;
  options: string[];
  onChange: (name: string, value: string) => void;
};

export function SelectInput({ label, name, value, required = false, options, onChange }: SelectInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        name={name}
        required={required}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      >
        <option value="">Seleccionar</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
