interface Props {
  config: Record<string, any>;
  value: string;
  onChange: (val: string) => void;
}

export default function TextoCurto({ config, value, onChange }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={config.placeholder || 'Escreva aqui...'}
      className="w-full rounded-lg border-[1.5px] border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
    />
  );
}
