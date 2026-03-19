// Mock data store for prototype - will be replaced with Supabase

export interface Formulario {
  id: number;
  criado_em: string;
  nome: string;
  slug: string;
  ativo: boolean;
  descricao?: string;
  mensagem_fim?: string;
}

export interface Pergunta {
  id: number;
  formulario_id: number;
  tipo: 'matriz_nps' | 'nps_simples' | 'radio' | 'checkbox' | 'likert' | 'texto_longo' | 'texto_curto' | 'secao';
  texto: string;
  ordem: number;
  obrigatorio: boolean;
  config: Record<string, any>;
}

export interface Resposta {
  id: number;
  formulario_id: number;
  criado_em: string;
  ip_hash?: string;
}

export interface RespostaItem {
  id: number;
  resposta_id: number;
  pergunta_id: number;
  valor: string;
}

export interface MatrizItem {
  id: number;
  resposta_id: number;
  pergunta_id: number;
  linha: string;
  nota: number | null;
  is_na: boolean;
}

const DEPARTAMENTOS = [
  "ADMINISTRATIVO", "AJUSTAGEM", "ALMOXARIFADO", "CALDERARIA",
  "COMERCIAL", "COMPRAS", "CONTROLE DE QUALIDADE", "CUSTOS",
  "DEPARTAMENTO PESSOAL", "EXPEDIÇÃO/LOGISTICA", "FINANCEIRO",
  "FISCAL/FATURAMENTO", "MANUTENÇÃO", "PCP", "PINTURA", "RH",
  "SEGURANÇA DO TRABALHO", "SGI", "TECNOLOGIA DA INFORMAÇÃO", "USINAGEM"
];

let nextFormId = 3;
let nextPerguntaId = 20;
let nextRespostaId = 100;

export const formularios: Formulario[] = [
  {
    id: 1,
    criado_em: "2025-06-01T10:00:00Z",
    nome: "Pesquisa NPS 2025",
    slug: "pesquisa-nps-2025",
    ativo: true,
    descricao: "Avaliação semestral de satisfação dos colaboradores",
    mensagem_fim: "Obrigado pela sua participação! Suas respostas foram registradas com sucesso."
  },
  {
    id: 2,
    criado_em: "2025-05-15T10:00:00Z",
    nome: "Pesquisa de Clima 2025",
    slug: "pesquisa-clima-2025",
    ativo: false,
    descricao: "Pesquisa de clima organizacional",
    mensagem_fim: "Agradecemos sua contribuição!"
  }
];

export const perguntas: Pergunta[] = [
  {
    id: 1, formulario_id: 1, tipo: 'secao', texto: 'Avaliação por Departamento',
    ordem: 0, obrigatorio: false,
    config: { descricao: 'Avalie cada departamento da empresa com notas de 1 a 10.' }
  },
  {
    id: 2, formulario_id: 1, tipo: 'matriz_nps', texto: 'Como você avalia os departamentos abaixo?',
    ordem: 10, obrigatorio: true,
    config: { linhas: DEPARTAMENTOS, escala_min: 1, escala_max: 10, mostrar_na: true }
  },
  {
    id: 3, formulario_id: 1, tipo: 'secao', texto: 'Satisfação Geral',
    ordem: 20, obrigatorio: false,
    config: { descricao: 'Agora responda sobre sua experiência geral na empresa.' }
  },
  {
    id: 4, formulario_id: 1, tipo: 'nps_simples', texto: 'De 0 a 10, o quanto você recomendaria a Saquetto como um bom lugar para trabalhar?',
    ordem: 30, obrigatorio: true,
    config: { escala_min: 0, escala_max: 10, label_min: 'De jeito nenhum', label_max: 'Com certeza!' }
  },
  {
    id: 5, formulario_id: 1, tipo: 'radio', texto: 'Há quanto tempo você trabalha na empresa?',
    ordem: 40, obrigatorio: true,
    config: { opcoes: ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos'] }
  },
  {
    id: 6, formulario_id: 1, tipo: 'checkbox', texto: 'Quais benefícios você mais valoriza?',
    ordem: 50, obrigatorio: false,
    config: { opcoes: ['Plano de saúde', 'Vale alimentação', 'Vale transporte', 'Horário flexível', 'Home office'] }
  },
  {
    id: 7, formulario_id: 1, tipo: 'likert', texto: 'Sinto-me valorizado na empresa.',
    ordem: 60, obrigatorio: true,
    config: { escala: 5, labels: ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'] }
  },
  {
    id: 8, formulario_id: 1, tipo: 'texto_longo', texto: 'O que a empresa poderia melhorar?',
    ordem: 70, obrigatorio: false,
    config: { placeholder: 'Escreva sua sugestão aqui...' }
  },
  {
    id: 9, formulario_id: 1, tipo: 'texto_curto', texto: 'Em qual setor você trabalha?',
    ordem: 80, obrigatorio: false,
    config: { placeholder: 'Ex: Produção' }
  },
];

// Generate mock respostas
const generateMockRespostas = (): { respostas: Resposta[]; respostaItens: RespostaItem[]; matrizItens: MatrizItem[] } => {
  const respostas: Resposta[] = [];
  const respostaItens: RespostaItem[] = [];
  const matrizItens: MatrizItem[] = [];
  let itemId = 1;
  let matrizId = 1;

  for (let i = 1; i <= 47; i++) {
    const r: Resposta = {
      id: i,
      formulario_id: 1,
      criado_em: new Date(2025, 5, Math.floor(Math.random() * 30) + 1).toISOString(),
      ip_hash: `hash_${i}`
    };
    respostas.push(r);

    // NPS simples (pergunta 4)
    const npsNota = Math.floor(Math.random() * 11);
    respostaItens.push({ id: itemId++, resposta_id: i, pergunta_id: 4, valor: String(npsNota) });

    // Radio (pergunta 5)
    const tempos = ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos'];
    respostaItens.push({ id: itemId++, resposta_id: i, pergunta_id: 5, valor: tempos[Math.floor(Math.random() * tempos.length)] });

    // Likert (pergunta 7)
    const likertLabels = ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'];
    respostaItens.push({ id: itemId++, resposta_id: i, pergunta_id: 7, valor: likertLabels[Math.floor(Math.random() * likertLabels.length)] });

    // Texto longo (pergunta 8) - some have answers
    if (Math.random() > 0.4) {
      const textos = ['Melhorar a comunicação interna', 'Mais oportunidades de crescimento', 'Ambiente de trabalho poderia ser melhor', 'Investir em treinamentos'];
      respostaItens.push({ id: itemId++, resposta_id: i, pergunta_id: 8, valor: textos[Math.floor(Math.random() * textos.length)] });
    }

    // Matriz NPS (pergunta 2) - random departments
    for (const dept of DEPARTAMENTOS) {
      if (Math.random() > 0.15) {
        const isNa = Math.random() > 0.85;
        matrizItens.push({
          id: matrizId++,
          resposta_id: i,
          pergunta_id: 2,
          linha: dept,
          nota: isNa ? null : Math.floor(Math.random() * 10) + 1,
          is_na: isNa
        });
      }
    }
  }

  return { respostas, respostaItens, matrizItens };
};

const mockData = generateMockRespostas();
export const respostas: Resposta[] = mockData.respostas;
export const respostaItens: RespostaItem[] = mockData.respostaItens;
export const matrizItens: MatrizItem[] = mockData.matrizItens;

// Helper functions
export function getFormularioBySlug(slug: string) {
  return formularios.find(f => f.slug === slug);
}

export function getPerguntasByFormulario(formularioId: number) {
  return perguntas.filter(p => p.formulario_id === formularioId).sort((a, b) => a.ordem - b.ordem);
}

export function getRespostasByFormulario(formularioId: number) {
  return respostas.filter(r => r.formulario_id === formularioId);
}

export function addFormulario(data: { nome: string; slug: string; descricao?: string; mensagem_fim?: string }) {
  const f: Formulario = {
    id: nextFormId++,
    criado_em: new Date().toISOString(),
    ativo: true,
    ...data
  };
  formularios.push(f);
  return f;
}

export function addPergunta(data: Omit<Pergunta, 'id'>) {
  const p: Pergunta = { id: nextPerguntaId++, ...data };
  perguntas.push(p);
  return p;
}

export function removePergunta(id: number) {
  const idx = perguntas.findIndex(p => p.id === id);
  if (idx !== -1) perguntas.splice(idx, 1);
}

export function updatePergunta(id: number, updates: Partial<Pergunta>) {
  const p = perguntas.find(p => p.id === id);
  if (p) Object.assign(p, updates);
  return p;
}

export function toggleFormularioAtivo(id: number) {
  const f = formularios.find(f => f.id === id);
  if (f) f.ativo = !f.ativo;
  return f;
}

export function deleteFormulario(id: number) {
  const idx = formularios.findIndex(f => f.id === id);
  if (idx !== -1) formularios.splice(idx, 1);
  // Also remove related perguntas
  for (let i = perguntas.length - 1; i >= 0; i--) {
    if (perguntas[i].formulario_id === id) perguntas.splice(i, 1);
  }
}

export function calcNpsStats(formularioId: number) {
  const formRespostas = respostas.filter(r => r.formulario_id === formularioId);
  const npsPerguntas = perguntas.filter(p => p.formulario_id === formularioId && p.tipo === 'nps_simples');
  
  if (npsPerguntas.length === 0) return null;

  const npsItens = respostaItens.filter(ri => npsPerguntas.some(p => p.id === ri.pergunta_id));
  const total = npsItens.length;
  if (total === 0) return null;

  const promotores = npsItens.filter(ri => parseInt(ri.valor) >= 9).length;
  const passivos = npsItens.filter(ri => { const v = parseInt(ri.valor); return v >= 7 && v <= 8; }).length;
  const detratores = npsItens.filter(ri => parseInt(ri.valor) <= 6).length;
  const score = Math.round((promotores / total - detratores / total) * 100);

  return { score, promotores, passivos, detratores, total, totalRespostas: formRespostas.length };
}

export function calcMatrizMedias(formularioId: number) {
  const matrizPerguntas = perguntas.filter(p => p.formulario_id === formularioId && p.tipo === 'matriz_nps');
  const items = matrizItens.filter(mi => matrizPerguntas.some(p => p.id === mi.pergunta_id));

  const byLinha: Record<string, { notas: number[]; naCount: number }> = {};
  for (const item of items) {
    if (!byLinha[item.linha]) byLinha[item.linha] = { notas: [], naCount: 0 };
    if (item.is_na) {
      byLinha[item.linha].naCount++;
    } else if (item.nota !== null) {
      byLinha[item.linha].notas.push(item.nota);
    }
  }

  return Object.entries(byLinha)
    .map(([linha, data]) => ({
      linha,
      media: data.notas.length > 0 ? Number((data.notas.reduce((a, b) => a + b, 0) / data.notas.length).toFixed(1)) : 0,
      avaliacoes: data.notas.length,
      na: data.naCount
    }))
    .sort((a, b) => b.media - a.media);
}
