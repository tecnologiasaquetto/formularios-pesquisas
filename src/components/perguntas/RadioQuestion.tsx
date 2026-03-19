interface Props {
  config: Record<string, any>;
  value: string | undefined;
  onChange: (val: string) => void;
}

export default function RadioQuestion({ config, value, onChange }: Props) {
  const opcoes: string[] = config.opcoes || [];

  return (
    <div className="space-y-2">
      {opcoes.map(op => (
        <button
          key={op}
          onClick={() => onChange(op)}
          className={`flex w-full items-center gap-3 rounded-lg border-[1.5px] px-4 py-3 text-sm text-left transition-colors ${
            value === op
              ? 'border-primary bg-secondary'
              : 'border-input hover:bg-muted'
          }`}
        >
          <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 flex-shrink-0 ${
            value === op ? 'border-primary' : 'border-input'
          }`}>
            {value === op && <span className="h-2 w-2 rounded-full bg-primary" />}
          </span>
          {op}
        </button>
      ))}
    </div>
  );
}
