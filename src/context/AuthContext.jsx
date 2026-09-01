import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('eventgen_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('eventgen_access_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('eventgen_user', JSON.stringify(res.user));
          }
        } catch (e) {
          // Token invalid
          localStorage.removeItem('eventgen_access_token');
          localStorage.removeItem('eventgen_refresh_token');
          localStorage.removeItem('eventgen_user');
          setUser(null);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.accessToken) {
      localStorage.setItem('eventgen_access_token', res.accessToken);
      localStorage.setItem('eventgen_refresh_token', res.refreshToken);
      localStorage.setItem('eventgen_user', JSON.stringify(res.user));
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('eventgen_access_token');
    localStorage.removeItem('eventgen_refresh_token');
    localStorage.removeItem('eventgen_user');
    setUser(null);
  };

  const isSuperAdmin = user?.role === 'SUPERADMIN';

  return (
    <AuthContext.Provider value={{ user, login, logout, isSuperAdmin, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
