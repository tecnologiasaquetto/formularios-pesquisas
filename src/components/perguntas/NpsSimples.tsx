interface Props {
  config: Record<string, any>;
  value: number | undefined;
  onChange: (val: number) => void;
}

export default function NpsSimples({ config, value, onChange }: Props) {
  const min = config.escala_min ?? 0;
  const max = config.escala_max ?? 10;
  const notas = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {notas.map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg text-sm font-medium transition-colors ${
              value === n
                ? 'bg-primary text-primary-foreground'
                : 'border border-input hover:bg-muted'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{config.label_min || ''}</span>
        <span>{config.label_max || ''}</span>
      </div>
    </div>
  );
}
