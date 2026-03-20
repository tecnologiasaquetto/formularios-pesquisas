import React from "react";
import { Navigate } from "react-router-dom";
import { useRequireAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthorized } = useRequireAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthorized) {
    return fallback || <Navigate to="/login" replace />;
  }

  // Check role requirements
  if (requiredRole && user?.perfil !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acesso Negado
          </h1>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Seu perfil atual: <strong>{user?.perfil}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Perfil necessário: <strong>{requiredRole}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
}

// Higher-order component for admin routes
export function withAdminProtection<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AdminProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole="administrador">
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook to check if user has specific permission
export function usePermission(permission: string): boolean {
  const { user } = useRequireAuth();
  
  if (!user) return false;
  
  const permissions = {
    administrador: [
      'manage_users',
      'manage_forms',
      'view_all_data',
      'export_data',
      'delete_data'
    ],
    visualizador: [
      'view_forms',
      'view_dashboard',
      'export_basic'
    ]
  };
  
  return permissions[user.perfil]?.includes(permission) || false;
}
