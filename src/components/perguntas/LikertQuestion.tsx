interface Props {
  config: Record<string, any>;
  value: string | undefined;
  onChange: (val: string) => void;
}

export default function LikertQuestion({ config, value, onChange }: Props) {
  const labels: string[] = config.labels || [];

  return (
    <div className="flex flex-wrap gap-2">
      {labels.map(label => (
        <button
          key={label}
          onClick={() => onChange(label)}
          className={`flex-1 min-w-[100px] rounded-lg px-3 py-2.5 text-xs sm:text-sm font-medium text-center transition-colors ${
            value === label
              ? 'bg-primary text-primary-foreground'
              : 'border border-input hover:bg-muted'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
