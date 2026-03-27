import { type PerguntaMock } from "@/services/formularioServiceAdapter";
import MatrizNps from "./MatrizNps";
import NpsSimples from "./NpsSimples";
import RadioQuestion from "./RadioQuestion";
import CheckboxQuestion from "./CheckboxQuestion";
import LikertQuestion from "./LikertQuestion";
import TextoLongo from "./TextoLongo";
import TextoCurto from "./TextoCurto";

interface Props {
  pergunta: PerguntaMock;
  value: any;
  onChange: (val: any) => void;
  error?: string;
}

export default function QuestionRenderer({ pergunta, value, onChange, error }: Props) {
  switch (pergunta.tipo) {
    case 'matriz_nps':
      return <MatrizNps config={pergunta.config} value={value || {}} onChange={onChange} error={error} />;
    case 'nps_simples':
      return <NpsSimples config={pergunta.config} value={value} onChange={onChange} />;
    case 'radio':
      return <RadioQuestion config={pergunta.config} value={value} onChange={onChange} />;
    case 'checkbox':
      return <CheckboxQuestion config={pergunta.config} value={value || []} onChange={onChange} />;
    case 'likert':
      return <LikertQuestion config={pergunta.config} value={value} onChange={onChange} />;
    case 'texto_longo':
      return <TextoLongo config={pergunta.config} value={value || ''} onChange={onChange} />;
    case 'texto_curto':
      return <TextoCurto config={pergunta.config} value={value || ''} onChange={onChange} />;
    default:
      return null;
  }
}
