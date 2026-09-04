import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import api from '../lib/api';

interface AuthUser {
  id?: number;
  name: string;
  email: string;
  role?: string;
  username?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: AuthUser | null;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('auth_token') !== null;
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('auth_token');
  });

  /**
   * On mount, if we have a stored token, verify it's still valid
   * by calling GET /api/auth/me. If the token is invalid, force logout.
   */
  useEffect(() => {
    const validateSession = async () => {
      const storedToken = sessionStorage.getItem('auth_token');
      if (!storedToken) {
        setIsInitializing(false);
        return;
      }

      try {
        const data = await api.get<{ id: number; name: string; email: string; role: string; username?: string }>('/auth/me');
        const userData: AuthUser = {
          id: data.id,
          name: data.name,
          email: data.email || data.name,
          role: data.role,
          username: data.username || undefined,
        };
        setUser(userData);
        // Persist updated user info back to sessionStorage
        sessionStorage.setItem('auth_user', JSON.stringify(userData));
        setToken(storedToken);
        setIsAuthenticated(true);
      } catch {
        // Token invalid or expired — clear session
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    };

    validateSession();
  }, []);

  /**
   * Strict login via the backend API only.
   * Sends POST /auth/login with { username, password }.
   * Backend sets httpOnly cookie automatically.
   *
   * If the backend returns a 401 Unauthorized, this function throws
   * explicitly so the Login UI can display "Invalid credentials".
   * No mock fallback — authentication is always enforced server-side.
   */
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!username.trim() || !password.trim()) {
      throw new Error('Username and password are required');
    }

    try {
      const data = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
        username,
        password,
      });

      // Only proceed if the backend returned a valid token
      if (!data || !data.token) {
        throw new Error('Invalid response from server');
      }

      // Store token in sessionStorage for Authorization header usage
      sessionStorage.setItem('auth_token', data.token);
      sessionStorage.setItem('auth_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (err: unknown) {
      // Extract the actual error message from the backend response
      const errorMessage = err instanceof Error ? err.message : 'Invalid credentials';

      // Always fail — no mock fallback permitted
      console.error('[Auth] Login failed:', errorMessage);
      setIsAuthenticated(false);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Logout — calls backend to clear the httpOnly cookie,
   * then wipes local session storage regardless of network result.
   */
  const logout = useCallback(async () => {
    try {
      // Fire backend logout to clear the httpOnly cookie
      await api.post('/auth/logout', {});
    } catch {
      // Even if network fails, clear local state
    }

    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isInitializing, login, logout, user, token }}>
      {children}
    </AuthContext.Provider>
  );
};