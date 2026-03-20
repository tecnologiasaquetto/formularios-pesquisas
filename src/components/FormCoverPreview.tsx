import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type Formulario } from "@/lib/mockData";

interface FormCoverPreviewProps {
  formulario: Formulario;
  onStart: () => void;
}

export default function FormCoverPreview({ formulario, onStart }: FormCoverPreviewProps) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="max-w-lg mx-4 shadow-xl border-0">
        <CardContent className="p-8">
          {/* Logo */}
          {formulario.logo_url && !imageError && (
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shadow-lg">
                <img
                  src={formulario.logo_url}
                  alt="Logo"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="text-center mb-6">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: formulario.cor_tema }}
            >
              {formulario.nome}
            </h1>
            {formulario.descricao && (
              <p className="text-muted-foreground text-lg">{formulario.descricao}</p>
            )}
          </div>

          {/* Date Info */}
          {(formulario.data_inicio || formulario.data_fim) && (
            <div className="flex justify-center gap-4 mb-6 text-sm text-muted-foreground">
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

          {/* Start Button */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={onStart}
              className="px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              style={{ 
                backgroundColor: formulario.cor_tema,
                borderColor: formulario.cor_tema
              }}
            >
              Começar Pesquisa
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Building2 className="w-3 h-3" />
              Pesquisa Confidencial • Seus dados estão seguros
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
