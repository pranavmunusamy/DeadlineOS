import { createContext, useState, useEffect, useCallback } from 'react';
import { getProfile } from '../services/api';

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('deadlineos_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await getProfile();
      setUser(data);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('deadlineos_token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (token) => {
    localStorage.setItem('deadlineos_token', token);
    checkAuth();
  };

  const logout = () => {
    localStorage.removeItem('deadlineos_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
