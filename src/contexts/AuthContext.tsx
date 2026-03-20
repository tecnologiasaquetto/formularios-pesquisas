import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, AuthState, LoginCredentials } from "@/types/auth";
import { authenticateUser } from "@/lib/usersMockData";

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
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        localStorage.removeItem('auth_user');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const user = authenticateUser(credentials.email, credentials.senha);
      
      if (user) {
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        
        // Store in localStorage
        localStorage.setItem('auth_user', JSON.stringify(user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
    
    localStorage.removeItem('auth_user');
  };

  const updateUser = (user: User) => {
    setAuthState(prev => ({
      ...prev,
      user
    }));
    
    localStorage.setItem('auth_user', JSON.stringify(user));
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
