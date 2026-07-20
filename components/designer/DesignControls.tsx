/** Controles reutilizables del diseñador: un <select> etiquetado y una tarjeta de resumen. */

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 font-semibold">{label}</h3>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border p-3"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="font-semibold">{title}</h3>
      <p>{value}</p>
    </div>
  );
}
