import React, { createContext, useContext, useState, ReactNode } from "react";

interface BreadcrumbContextType {
  itemName: string;
  setItemName: (name: string) => void;
  resetItemName: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [itemName, setItemName] = useState("");

  const resetItemName = () => setItemName("");

  return (
    <BreadcrumbContext.Provider value={{ itemName, setItemName, resetItemName }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return context;
}
