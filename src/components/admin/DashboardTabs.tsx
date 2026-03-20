import React from "react";
import type { AdminTab } from "@/types";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        active
          ? 'bg-background border-b-2 border-primary text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
    >
      {children}
    </button>
  );
}

interface DashboardTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  hasMatriz: boolean;
}

export default function DashboardTabs({ activeTab, onTabChange, hasMatriz }: DashboardTabsProps) {
  return (
    <div className="flex gap-1 border-b mb-6">
      <TabButton active={activeTab === 'dashboard'} onClick={() => onTabChange('dashboard')}>
        Dashboard
      </TabButton>
      <TabButton active={activeTab === 'charts'} onClick={() => onTabChange('charts')}>
        Gráficos
      </TabButton>
      <TabButton active={activeTab === 'respostas'} onClick={() => onTabChange('respostas')}>
        Respostas
      </TabButton>
      {hasMatriz && (
        <TabButton active={activeTab === 'departamentos'} onClick={() => onTabChange('departamentos')}>
          Departamentos
        </TabButton>
      )}
    </div>
  );
}
