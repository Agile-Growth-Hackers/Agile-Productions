/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('admin_user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        localStorage.removeItem('admin_user');
        setUser({ authenticated: true });
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    const userData = {
      authenticated: true,
      id: data.user.id,
      username: data.user.username,
      fullName: data.user.fullName,
      email: data.user.email,
      isSuperAdmin: data.user.isSuperAdmin,
      profilePictureUrl: data.user.profilePictureUrl
    };
    setUser(userData);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    return data;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    api.clearAuth();
    setUser(null);
    localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
