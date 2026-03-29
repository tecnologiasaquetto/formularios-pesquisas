import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FormCoverProps {
  formulario: any;
  onStart: () => void;
}

export default function FormCover({ formulario, onStart }: FormCoverProps) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const isExpired = formulario.data_fim && new Date(formulario.data_fim) < new Date();
  const notStarted = formulario.data_inicio && new Date(formulario.data_inicio) > new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pesquisa Encerrada</h1>
            <p className="text-muted-foreground">
              Esta pesquisa foi encerrada em {formatDate(formulario.data_fim!)}.
              Obrigado pelo seu interesse!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pesquisa em Breve</h1>
            <p className="text-muted-foreground">
              Esta pesquisa estará disponível a partir de {formatDate(formulario.data_inicio!)}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4"
      style={{ 
        backgroundColor: formulario.cor_tema ? `${formulario.cor_tema}08` : undefined,
        backgroundImage: formulario.cor_tema 
          ? `linear-gradient(135deg, ${formulario.cor_tema}08 0%, transparent 50%)`
          : undefined
      }}
    >
      <Card className="max-w-2xl w-full shadow-xl border-0">
        <CardContent className="p-8 md:p-12">
          <div className="text-center space-y-6">
            {/* Logo */}
            {formulario.logo_url && !imageError && (
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-lg bg-white shadow-md p-3 flex items-center justify-center">
                  <img
                    src={formulario.logo_url}
                    alt="Logo da empresa"
                    className="max-w-full max-h-full object-contain"
                    onError={() => setImageError(true)}
                  />
                </div>
              </div>
            )}

            {/* Título */}
            <div className="space-y-2">
              <h1 
                className="text-3xl md:text-4xl font-bold text-foreground"
                style={{ color: formulario.cor_tema || undefined }}
              >
                {formulario.nome}
              </h1>
              
              {formulario.descricao && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {formulario.descricao}
                </p>
              )}
            </div>

            {/* Informações de Período */}
            {(formulario.data_inicio || formulario.data_fim) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
                {formulario.data_inicio && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Início: {formatDate(formulario.data_inicio)}</span>
                  </div>
                )}
                {formulario.data_fim && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Término: {formatDate(formulario.data_fim)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Informações Adicionais */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>Pesquisa Confidencial • Anônima</span>
              </div>
              
              {/* Explicação sobre Não se aplica */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-lg mx-auto">
                <p className="text-sm text-blue-900 font-medium mb-2">💡 Dica importante:</p>
                <p className="text-sm text-blue-800">
                  Durante a pesquisa, você verá o botão <strong>"Não se aplica"</strong> em algumas perguntas. 
                  Use-o quando a pergunta não for relevante para você ou quando não tiver como avaliar aquele item específico.
                </p>
              </div>
            </div>

            {/* Botão de Começar */}
            <div className="pt-4">
              <Button 
                onClick={onStart}
                size="lg"
                className="px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ 
                  backgroundColor: formulario.cor_tema,
                  borderColor: formulario.cor_tema
                }}
              >
                Começar Pesquisa
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Termos */}
            <div className="text-xs text-muted-foreground/60 max-w-md mx-auto">
              <p>
                Ao participar, você concorda com nossos termos de uso e política de privacidade. 
                Suas respostas são confidenciais e serão usadas apenas para fins de melhoria contínua.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
