// Teste rápido para verificar se as funções de salvamento funcionam
import { addResposta, addRespostaItem, addMatrizItem, formularios } from './src/lib/mockData.js';

console.log('Testando salvamento de respostas...');

// Testar adicionar resposta
const novaResposta = addResposta({
  formulario_id: 2,
  criado_em: new Date().toISOString(),
  ip_hash: 'test_hash_123'
});

console.log('Resposta criada:', novaResposta);

// Testar adicionar item de resposta
const respostaItem = addRespostaItem({
  resposta_id: novaResposta.id,
  pergunta_id: 8,
  valor: '8'
});

console.log('Item de resposta criado:', respostaItem);

// Testar adicionar item de matriz
const matrizItem = addMatrizItem({
  resposta_id: novaResposta.id,
  pergunta_id: 6,
  linha: 'ADMINISTRATIVO',
  nota: 7,
  is_na: false
});

console.log('Item de matriz criado:', matrizItem);

console.log('Total de formulários:', formularios.length);
console.log('Teste concluído com sucesso!');
