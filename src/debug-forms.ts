// Debug script para verificar formulários
import { formularios } from "./lib/mockData";

console.log("=== DEBUG FORMULÁRIOS ===");
console.log("Total de formulários:", formularios.length);
console.log("Formulários:", formularios);

formularios.forEach((form, index) => {
  console.log(`Formulário ${index + 1}:`, {
    id: form.id,
    nome: form.nome,
    slug: form.slug,
    ativo: form.ativo
  });
});

export {};
