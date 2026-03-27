import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formularioService } from "@/services/supabase";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { ArrowLeft, Save, Upload, Palette, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const PRESET_COLORS = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#10b981" },
  { name: "Roxo", value: "#8b5cf6" },
  { name: "Laranja", value: "#f97316" },
  { name: "Vermelho", value: "#ef4444" },
  { name: "Cinza", value: "#6b7280" },
];

export default function FormSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setItemName, resetItemName } = useBreadcrumb();

  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await formularioService.getById(id);
        if (data) {
          setFormData({
            nome: data.nome,
            slug: data.slug,
            descricao: data.descricao || "",
            mensagem_fim: data.mensagem_fim || "",
            logo_url: data.logo_url || "",
            data_inicio: data.data_inicio || "",
            data_fim: data.data_fim || "",
            mostrar_capa: data.mostrar_capa ?? true,
            cor_tema: data.cor_tema || "#3b82f6",
          });
          if (data.nome) {
            setItemName(data.nome);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar formulário:", error);
        toast.error("Erro ao carregar formulário");
      } finally {
        setLoading(false);
      }
    };
    loadForm();
    return () => resetItemName();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!formData.nome && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Formulário não encontrado.</p>
        <Button variant="link" onClick={() => navigate("/admin/formularios")}>Voltar para a lista</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);

    try {
      await formularioService.update(id, formData);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = () => {
    // Simulação de upload - na implementação real, faria upload para Supabase Storage
    const mockUrl = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop&crop=center";
    setFormData(prev => ({ ...prev, logo_url: mockUrl }));
    toast.success("Logo carregado com sucesso! (Simulação)");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/admin/formularios/${id}/construtor`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Configurações do Formulário</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome da Pesquisa</Label>
                <Input
                  id="nome"
                  value={formData.nome || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug (URL amigável)</Label>
                <Input
                  id="slug"
                  value={formData.slug || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="mensagem_fim">Mensagem Final</Label>
              <Textarea
                id="mensagem_fim"
                value={formData.mensagem_fim || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, mensagem_fim: e.target.value }))}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações da Capa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Configurações da Capa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Mostrar tela de capa</Label>
                <p className="text-sm text-muted-foreground">
                  Exibir uma tela de apresentação antes do formulário
                </p>
              </div>
              <Switch
                checked={formData.mostrar_capa ?? true}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, mostrar_capa: checked }))}
              />
            </div>

            <Separator />

            {/* Logo */}
            <div>
              <Label>Logo da Empresa</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.logo_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Button type="button" variant="outline" onClick={handleImageUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  {formData.logo_url ? "Alterar Logo" : "Fazer Upload"}
                </Button>
              </div>
            </div>

            {/* Cor do Tema */}
            <div>
              <Label className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Cor do Tema
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="color"
                  value={formData.cor_tema || "#3b82f6"}
                  onChange={(e) => setFormData(prev => ({ ...prev, cor_tema: e.target.value }))}
                  className="w-20 h-10"
                />
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, cor_tema: color.value }))}
                      className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Período da Pesquisa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Período da Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_inicio">Data de Início</Label>
                <Input
                  id="data_inicio"
                  type="datetime-local"
                  value={formData.data_inicio ? new Date(formData.data_inicio).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
                />
              </div>
              <div>
                <Label htmlFor="data_fim">Data de Término</Label>
                <Input
                  id="data_fim"
                  type="datetime-local"
                  value={formData.data_fim ? new Date(formData.data_fim).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_fim: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Deixe em branco para não ter limite de tempo
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/admin/formularios/${id}/construtor`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
