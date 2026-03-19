interface Props {
  config: Record<string, any>;
  value: string;
  onChange: (val: string) => void;
}

export default function TextoLongo({ config, value, onChange }: Props) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={config.placeholder || 'Escreva aqui...'}
      rows={4}
      className="w-full rounded-lg border-[1.5px] border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-y min-h-[90px]"
    />
  );
}
