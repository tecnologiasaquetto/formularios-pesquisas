// Authentication and User Management Types

export type UserRole = 'administrador' | 'visualizador';

export interface User {
  id: number;
  nome: string;
  email: string;
  senha: string; // Em real app seria hash
  perfil: UserRole;
  ativo: boolean;
  criado_em: string;
  ultimo_acesso?: string;
  criado_por?: number; // ID do admin que criou
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface CreateUserData {
  nome: string;
  email: string;
  senha: string;
  perfil: UserRole;
}

export interface UpdateUserData {
  nome?: string;
  email?: string;
  senha?: string;
  perfil?: UserRole;
  ativo?: boolean;
  ultimo_acesso?: string;
}

// Permission checks
export function isAdmin(user: User | null): boolean {
  return user?.perfil === 'administrador';
}

export function canManageUsers(user: User | null): boolean {
  return user?.perfil === 'administrador';
}

export function canViewDashboard(user: User | null): boolean {
  return user?.ativo === true;
}

export function canExportData(user: User | null): boolean {
  return user?.perfil === 'administrador';
}

// Role labels
export const ROLE_LABELS: Record<UserRole, string> = {
  administrador: 'Administrador',
  visualizador: 'Visualizador'
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  administrador: 'Acesso completo ao sistema. Pode gerenciar usuários, formulários e ver todos os dados.',
  visualizador: 'Acesso somente leitura. Pode visualizar dashboards e exportar relatórios básicos.'
};

// Role colors for UI
export const ROLE_COLORS: Record<UserRole, string> = {
  administrador: 'bg-red-100 text-red-800 border-red-200',
  visualizador: 'bg-blue-100 text-blue-800 border-blue-200'
};

// Form validation types
export interface UserFormErrors {
  nome?: string;
  email?: string;
  senha?: string;
  perfil?: string;
}

export interface UserFilters {
  search?: string;
  perfil?: UserRole | 'todos';
  ativo?: boolean | 'todos';
  criado_em?: {
    start?: Date;
    end?: Date;
  };
}
