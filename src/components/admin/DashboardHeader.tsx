import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Formulario, DateFilters } from "@/types";

interface DashboardHeaderProps {
  formulario: Formulario;
  isExporting: boolean;
  dateFilters: DateFilters;
  showStartCalendar: boolean;
  showEndCalendar: boolean;
  filteredRespostas: any[];
  allRespostas: any[];
  onExportCSV: () => void;
  onExportExcel: () => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onClearFilters: () => void;
  onToggleStartCalendar: () => void;
  onToggleEndCalendar: () => void;
}

const DashboardHeader = React.memo(function DashboardHeader({
  formulario,
  isExporting,
  dateFilters,
  showStartCalendar,
  showEndCalendar,
  filteredRespostas,
  allRespostas,
  onExportCSV,
  onExportExcel,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onToggleStartCalendar,
  onToggleEndCalendar
}: DashboardHeaderProps) {
  // Memoizar handlers para evitar recriação
  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    onStartDateChange(date);
    onToggleStartCalendar();
  }, [onStartDateChange, onToggleStartCalendar]);

  const handleEndDateSelect = useCallback((date: Date | undefined) => {
    onEndDateChange(date);
    onToggleEndCalendar();
  }, [onEndDateChange, onToggleEndCalendar]);
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">{formulario.nome}</h1>
          <Link to={`/f/${formulario.slug}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
            /f/{formulario.slug}
          </Link>
        </div>
        <div className="flex gap-2">
          {/* Date Filters */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            {/* Start Date */}
            <Popover open={showStartCalendar} onOpenChange={onToggleStartCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                >
                  Início
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFilters.startDate}
                  onSelect={onStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-xs text-muted-foreground">—</span>

            {/* End Date */}
            <Popover open={showEndCalendar} onOpenChange={onToggleEndCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                >
                  Fim
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFilters.endDate}
                  onSelect={onEndDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {dateFilters.hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 px-2 text-xs"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Active Filters Badge */}
          {dateFilters.hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {filteredRespostas.length} de {allRespostas.length} respostas
            </Badge>
          )}

          {/* Export Buttons */}
          <button
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
            onClick={onExportCSV}
            disabled={isExporting}
          >
            <Download className={`h-4 w-4 ${isExporting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
            onClick={onExportExcel}
            disabled={isExporting}
          >
            <FileSpreadsheet className={`h-4 w-4 ${isExporting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Excel'}</span>
          </button>
          <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default DashboardHeader;
