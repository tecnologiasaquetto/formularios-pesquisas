import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, AuthState, LoginCredentials } from "@/types/auth";
import { supabase } from "@/lib/supabase";
import { userService } from "@/services/supabase";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          // Buscar dados do usuário na tabela users
          const userData = await userService.getById(session.user.id);
          
          const user: User = {
            id: parseInt(userData.id) || 0,
            email: userData.email,
            nome: userData.nome,
            senha: '', // Não armazenar senha no frontend
            perfil: userData.role as 'administrador' | 'visualizador',
            ativo: userData.ativo,
            criado_em: userData.criado_em || new Date().toISOString(),
            ultimo_acesso: userData.ultimo_acesso || undefined
          };
          
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Session check error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const userData = await userService.getById(session.user.id);
          const user: User = {
            id: parseInt(userData.id) || 0,
            email: userData.email,
            nome: userData.nome,
            senha: '', // Não armazenar senha no frontend
            perfil: userData.role as 'administrador' | 'visualizador',
            ativo: userData.ativo,
            criado_em: userData.criado_em || new Date().toISOString(),
            ultimo_acesso: userData.ultimo_acesso || undefined
          };
          
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      // Autenticar com Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.senha
      });
      
      if (error) {
        console.error('Login error:', error.message);
        return false;
      }
      
      if (data.user) {
        // Buscar dados do usuário na tabela users
        const userData = await userService.getById(data.user.id);
        
        const user: User = {
          id: parseInt(userData.id) || 0,
          email: userData.email,
          nome: userData.nome,
          senha: '', // Não armazenar senha no frontend
          perfil: userData.role as 'administrador' | 'visualizador',
          ativo: userData.ativo,
          criado_em: userData.criado_em || new Date().toISOString(),
          ultimo_acesso: userData.ultimo_acesso || undefined
        };
        
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (user: User) => {
    setAuthState(prev => ({
      ...prev,
      user
    }));
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const auth = useAuth();
  
  if (auth.isLoading) {
    return { ...auth, isAuthorized: false };
  }
  
  return {
    ...auth,
    isAuthorized: auth.isAuthenticated
  };
}
