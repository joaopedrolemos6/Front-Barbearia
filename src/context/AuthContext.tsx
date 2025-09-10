// src/context/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  id: number;
  name: string;
  role: 'ADMIN' | 'CLIENT' | 'BARBER';
  exp: number; // ADICIONADO: Campo de expiração
}

interface AuthContextType {
  token: string | null;
  user: UserPayload | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsAdmin: () => Promise<void>;
  loginAsClient: () => Promise<void>;
  loginAsBarber: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        const decodedUser = jwtDecode<UserPayload>(storedToken);
        
        // MODIFICADO: Verifica se o token expirou
        if (decodedUser.exp * 1000 < Date.now()) {
          // Token expirado, remove
          localStorage.removeItem('authToken');
          setUser(null);
          setToken(null);
        } else {
          // Token válido
          setToken(storedToken);
          setUser(decodedUser);
        }
      }
    } catch (error) {
      console.error("Failed to decode token:", error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (token: string) => {
    setToken(token);
    localStorage.setItem('authToken', token);
    const decodedUser = jwtDecode<UserPayload>(token);
    setUser(decodedUser);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await api.login({ email, password });
      handleLogin(data.token);
      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error: any) {
      toast.error('Falha no login', { description: error.message });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsAdmin = async () => { /* ... */ };
  const loginAsClient = async () => { /* ... */ };
  const loginAsBarber = async () => { /* ... */ };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, loginAsAdmin, loginAsClient, loginAsBarber, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};