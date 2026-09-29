import { useEffect, useState } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext.js';

export const AuthProvider = ({ children }) => {
  const storedToken = localStorage.getItem('token');
  const [token, setToken] = useState(storedToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(storedToken));

  useEffect(() => {
    if (!storedToken) {
      return;
    }

    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [storedToken]);

  const saveSession = (session) => {
    localStorage.setItem('token', session.token);
    setToken(session.token);
    setUser(session.user);
  };

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    saveSession(data);
    return data;
  };

  const register = async (details) => {
    const { data } = await api.post('/auth/register', details);
    saveSession(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
