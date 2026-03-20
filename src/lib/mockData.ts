// Mock data store for prototype - will be replaced with Supabase
import type {
  Formulario, Pergunta, Resposta, RespostaItem, MatrizItem,
  Departamento
} from "@/types";

const DEPARTAMENTOS: Departamento[] = [
  "ADMINISTRATIVO", "AJUSTAGEM", "ALMOXARIFADO", "CALDERARIA",
  "COMERCIAL", "COMPRAS", "CONTROLE DE QUALIDADE", "CUSTOS",
  "DEPARTAMENTO PESSOAL", "EXPEDIÇÃO/LOGISTICA", "FINANCEIRO",
  "FISCAL/FATURAMENTO", "MANUTENÇÃO", "PCP", "PINTURA", "RH",
  "SEGURANÇA DO TRABALHO", "SGI", "TECNOLOGIA DA INFORMAÇÃO", "USINAGEM"
];

let nextFormId = 3;
let nextPerguntaId = 20;
let nextRespostaId = 1000; // Começar depois dos dados mock

export let formularios: Formulario[] = [
  {
    id: 1,
    criado_em: "2025-06-01T10:00:00Z",
    nome: "Pesquisa NPS 2025",
    slug: "pesquisa-nps-2025",
    ativo: true,
    descricao: "Avaliação semestral de satisfação dos colaboradores",
    mensagem_fim: "Obrigado pela sua participação! Suas respostas foram registradas com sucesso.",
    logo_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop&crop=center",
    data_inicio: "2025-06-01T00:00:00Z",
    data_fim: "2025-06-30T23:59:59Z",
    mostrar_capa: true,
    cor_tema: "#3b82f6"
  },
  {
    id: 2,
    criado_em: "2025-05-15T10:00:00Z",
    nome: "Pesquisa de Clima 2025",
    slug: "pesquisa-clima-2025",
    ativo: true,
    descricao: "Pesquisa de clima organizacional",
    mensagem_fim: "Agradecemos sua contribuição!",
    logo_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop&crop=center",
    data_inicio: "2026-03-01T00:00:00Z",
    data_fim: "2026-04-30T23:59:59Z",
    mostrar_capa: true,
    cor_tema: "#10b981"
  }
];

export let perguntas: Pergunta[] = [
  {
    id: 1, formulario_id: 1, tipo: 'secao', texto: 'Avaliação por Departamento',
    ordem: 0, obrigatorio: false,
    config: { descricao: 'Avalie cada departamento da empresa com notas de 0 a 10.' }
  },
  {
    id: 2, formulario_id: 1, tipo: 'matriz_nps', texto: 'Como você avalia os departamentos abaixo?',
    ordem: 10, obrigatorio: true,
    config: { linhas: DEPARTAMENTOS, escala_min: 0, escala_max: 10, mostrar_na: true }
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
    id: 5, formulario_id: 2, tipo: 'secao', texto: 'Avaliação por Departamento',
    ordem: 0, obrigatorio: false,
    config: { descricao: 'Avalie cada departamento da empresa com notas de 0 a 10.' }
  },
  {
    id: 6, formulario_id: 2, tipo: 'matriz_nps', texto: 'Como você avalia os departamentos abaixo?',
    ordem: 10, obrigatorio: true,
    config: { linhas: DEPARTAMENTOS, escala_min: 0, escala_max: 10, mostrar_na: true }
  },
  {
    id: 7, formulario_id: 2, tipo: 'secao', texto: 'Satisfação Geral',
    ordem: 20, obrigatorio: false,
    config: { descricao: 'Agora responda sobre sua experiência geral na empresa.' }
  },
  {
    id: 8, formulario_id: 2, tipo: 'nps_simples', texto: 'De 0 a 10, o quanto você recomendaria a Saquetto como um bom lugar para trabalhar?',
    ordem: 30, obrigatorio: true,
    config: { escala_min: 0, escala_max: 10, label_min: 'De jeito nenhum', label_max: 'Com certeza!' }
  },
  {
    id: 9, formulario_id: 1, tipo: 'radio', texto: 'Há quanto tempo você trabalha na empresa?',
    ordem: 40, obrigatorio: true,
    config: { opcoes: ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos'] }
  },
  {
    id: 10, formulario_id: 1, tipo: 'checkbox', texto: 'Quais benefícios você mais valoriza?',
    ordem: 50, obrigatorio: false,
    config: { opcoes: ['Plano de saúde', 'Vale alimentação', 'Vale transporte', 'Horário flexível', 'Home office'] }
  },
  {
    id: 11, formulario_id: 1, tipo: 'likert', texto: 'Sinto-me valorizado na empresa.',
    ordem: 60, obrigatorio: true,
    config: { escala: 5, labels: ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'] }
  },
  {
    id: 12, formulario_id: 1, tipo: 'texto_longo', texto: 'O que a empresa poderia melhorar?',
    ordem: 70, obrigatorio: false,
    config: { placeholder: 'Escreva sua sugestão aqui...' }
  },
  {
    id: 13, formulario_id: 1, tipo: 'texto_curto', texto: 'Em qual setor você trabalha?',
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
      formulario_id: 2, // Formulário de Clima 2025
      criado_em: new Date(2025, 5, Math.floor(Math.random() * 30) + 1).toISOString(),
      ip_hash: `hash_${i}`
    };
    respostas.push(r);

    // NPS simples (pergunta 8)
    const npsNota = Math.floor(Math.random() * 11);
    respostaItens.push({ id: itemId++, resposta_id: i, pergunta_id: 8, valor: String(npsNota) });

    // Matriz NPS (pergunta 6) - random departments
    for (const dept of DEPARTAMENTOS) {
      if (Math.random() > 0.15) {
        const isNa = Math.random() > 0.85;
        matrizItens.push({
          id: matrizId++,
          resposta_id: i,
          pergunta_id: 6,
          linha: dept,
          nota: isNa ? null : Math.floor(Math.random() * 11), // 0-10
          is_na: isNa
        });
      }
    }
  }

  return { respostas, respostaItens, matrizItens };
};

const mockData = generateMockRespostas();
export let respostas: Resposta[] = mockData.respostas;
export let respostaItens: RespostaItem[] = mockData.respostaItens;
export let matrizItens: MatrizItem[] = mockData.matrizItens;

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

export function addResposta(data: Omit<Resposta, 'id'>) {
  const r: Resposta = { id: nextRespostaId++, ...data };
  respostas.push(r);
  return r;
}

export function addRespostaItem(data: Omit<RespostaItem, 'id'>) {
  const ri: RespostaItem = { id: nextRespostaId++, ...data };
  respostaItens.push(ri);
  return ri;
}

export function addMatrizItem(data: Omit<MatrizItem, 'id'>) {
  const mi: MatrizItem = { id: nextRespostaId++, ...data };
  matrizItens.push(mi);
  return mi;
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

export function updateFormulario(id: number, updates: Partial<Formulario>) {
  const f = formularios.find(f => f.id === id);
  if (f) Object.assign(f, updates);
  return f;
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
  perguntas = perguntas.filter(p => p.formulario_id !== id);
}

export function reorderPergunta(perguntaId: number, newOrdem: number) {
  const pergunta = perguntas.find(p => p.id === perguntaId);
  if (!pergunta) return;
  
  const oldOrdem = pergunta.ordem;
  const formularioId = pergunta.formulario_id;
  
  // Update the moved question
  pergunta.ordem = newOrdem;
  
  // Update other questions in the same form
  perguntas.forEach(p => {
    if (p.formulario_id === formularioId && p.id !== perguntaId) {
      if (oldOrdem < newOrdem) {
        // Moving down: decrement questions between old and new position
        if (p.ordem > oldOrdem && p.ordem <= newOrdem) {
          p.ordem -= 10;
        }
      } else {
        // Moving up: increment questions between new and old position
        if (p.ordem >= newOrdem && p.ordem < oldOrdem) {
          p.ordem += 10;
        }
      }
    }
  });
}

export function duplicatePergunta(perguntaId: number) {
  const pergunta = perguntas.find(p => p.id === perguntaId);
  if (!pergunta) return null;

  // Find the highest order in the same form
  const maxOrdem = Math.max(...perguntas
    .filter(p => p.formulario_id === pergunta.formulario_id)
    .map(p => p.ordem));

  // Create a deep copy of the question
  const newPergunta: typeof pergunta = {
    ...pergunta,
    id: Math.max(...perguntas.map(p => p.id)) + 1,
    texto: `${pergunta.texto} (cópia)`,
    ordem: maxOrdem + 10,
  };

  perguntas.push(newPergunta);
  return newPergunta;
}

export function duplicateFormulario(formularioId: number) {
  const formulario = formularios.find(f => f.id === formularioId);
  if (!formulario) return null;

  const formPerguntas = getPerguntasByFormulario(formularioId);
  
  // Create a deep copy of the form
  const newFormulario: typeof formulario = {
    ...formulario,
    id: Math.max(...formularios.map(f => f.id)) + 1,
    nome: `${formulario.nome} (cópia)`,
    slug: `${formulario.slug}-copia-${Date.now()}`,
    criado_em: new Date().toISOString(),
    ativo: false, // Start as inactive
  };

  formularios.push(newFormulario);

  // Duplicate all questions
  formPerguntas.forEach(p => {
    const newPergunta: typeof p = {
      ...p,
      id: Math.max(...perguntas.map(p => p.id)) + 1,
      formulario_id: newFormulario.id,
      texto: p.texto, // Keep original text for form copies
    };
    perguntas.push(newPergunta);
  });

  return newFormulario;
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
    .map(([linha, data]) => {
      const totalValido = data.notas.length;
      if (totalValido === 0) {
        return {
          linha,
          media: 0,
          avaliacoes: 0,
          na: data.naCount,
          scoreNps: null,
          promotores: 0,
          passivos: 0,
          detratores: 0
        };
      }

      // Calcular NPS por departamento (escala 0-10)
      const promotores = data.notas.filter(n => n >= 9).length;
      const passivos = data.notas.filter(n => n >= 7 && n <= 8).length;
      const detratores = data.notas.filter(n => n <= 6).length;
      const scoreNps = Math.round((promotores / totalValido - detratores / totalValido) * 100);
      const media = Number((data.notas.reduce((a, b) => a + b, 0) / totalValido).toFixed(1));

      return {
        linha,
        media,
        avaliacoes: totalValido,
        na: data.naCount,
        scoreNps,
        promotores,
        passivos,
        detratores
      };
    })
    .sort((a, b) => (b.scoreNps ?? -100) - (a.scoreNps ?? -100)); // Ordenar por score NPS decrescente
}
