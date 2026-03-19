import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addFormulario, formularios } from "@/lib/mockData";
import { toast } from "sonner";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function NovoFormularioPage() {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");
  const [mensagemFim, setMensagemFim] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleNomeChange = (v: string) => {
    setNome(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const handleSlugChange = (v: string) => {
    setSlugManual(true);
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  const handleSubmit = () => {
    if (!nome.trim()) { setErro("Nome é obrigatório"); return; }
    if (!slug.trim()) { setErro("Slug é obrigatório"); return; }
    if (!/^[a-z0-9-]+$/.test(slug)) { setErro("Slug inválido — use apenas letras, números e hífens"); return; }
    if (formularios.some(f => f.slug === slug)) { setErro("Slug já existe"); return; }

    const f = addFormulario({
      nome: nome.trim(),
      slug,
      descricao: descricao.trim() || undefined,
      mensagem_fim: mensagemFim.trim() || undefined
    });
    toast.success("Formulário criado!");
    navigate(`/admin/formularios/${f.id}/construtor`);
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-6">Novo formulário</h1>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold mb-1.5">Nome do formulário *</label>
          <input
            type="text"
            placeholder="Ex: Pesquisa NPS 2025"
            value={nome}
            onChange={e => handleNomeChange(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5">Slug da URL *</label>
          <input
            type="text"
            value={slug}
            onChange={e => handleSlugChange(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
          {slug && (
            <p className="text-xs text-muted-foreground mt-1.5">
              Preview: {window.location.origin}/f/<strong>{slug}</strong>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5">Descrição <span className="font-normal text-muted-foreground">(opcional)</span></label>
          <input
            type="text"
            placeholder="Subtítulo exibido no topo do formulário"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5">Mensagem de agradecimento <span className="font-normal text-muted-foreground">(opcional)</span></label>
          <textarea
            placeholder="Obrigado pela sua participação! Suas respostas foram registradas com sucesso."
            value={mensagemFim}
            onChange={e => setMensagemFim(e.target.value)}
            rows={3}
            className="w-full rounded-lg border-[1.5px] border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-y"
          />
        </div>

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <button
          onClick={handleSubmit}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Criar formulário
        </button>
      </div>
    </div>
  );
}
