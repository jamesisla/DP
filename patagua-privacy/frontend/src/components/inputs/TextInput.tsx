type TextInputProps = {
  label: string;
  name: string;
  value: string;
  type?: "text" | "email" | "number";
  required?: boolean;
  onChange: (name: string, value: string) => void;
};

export function TextInput({ label, name, value, type = "text", required = false, onChange }: TextInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        name={name}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  );
}
