interface Props {
  config: Record<string, any>;
  value: string[];
  onChange: (val: string[]) => void;
}

export default function CheckboxQuestion({ config, value, onChange }: Props) {
  const opcoes: string[] = config.opcoes || [];

  const toggle = (op: string) => {
    if (value.includes(op)) {
      onChange(value.filter(v => v !== op));
    } else {
      onChange([...value, op]);
    }
  };

  return (
    <div className="space-y-2">
      {opcoes.map(op => (
        <button
          key={op}
          onClick={() => toggle(op)}
          className={`flex w-full items-center gap-3 rounded-lg border-[1.5px] px-4 py-3 text-sm text-left transition-colors ${
            value.includes(op)
              ? 'border-primary bg-secondary'
              : 'border-input hover:bg-muted'
          }`}
        >
          <span className={`flex h-4 w-4 items-center justify-center rounded border-2 flex-shrink-0 ${
            value.includes(op) ? 'border-primary bg-primary' : 'border-input'
          }`}>
            {value.includes(op) && <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12"><path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none"/></svg>}
          </span>
          {op}
        </button>
      ))}
    </div>
  );
}
