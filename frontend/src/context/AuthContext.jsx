import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [tokenRefreshTimer, setTokenRefreshTimer] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      const savedRefreshToken = localStorage.getItem('refreshToken');
      const savedSessionId = localStorage.getItem('sessionId');
      
      if (token && savedRefreshToken) {
        setRefreshToken(savedRefreshToken);
        setSessionId(savedSessionId);
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          startTokenRefreshTimer();
        } catch (error) {
          console.error("Failed to fetch user", error);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('sessionId');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const startTokenRefreshTimer = useCallback(() => {
    // Clear existing timer
    if (tokenRefreshTimer) clearInterval(tokenRefreshTimer);
    
    // Refresh token every 50 minutes (token expires in 1 hour)
    const timer = setInterval(() => {
      refreshAccessToken();
    }, 50 * 60 * 1000);
    
    setTokenRefreshTimer(timer);
  }, [tokenRefreshTimer]);

  const refreshAccessToken = useCallback(async () => {
    const refreshTok = localStorage.getItem('refreshToken');
    if (!refreshTok) return false;

    try {
      const res = await api.post('/auth/refresh', {
        refreshToken: refreshTok,
      });
      
      localStorage.setItem('token', res.data.accessToken);
      return true;
    } catch (error) {
      console.error("Token refresh failed", error);
      logout();
      return false;
    }
  }, []);

  const loginWithToken = async (token, refreshTok, sessionTok, deviceFingerprint = null) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshTok);
    localStorage.setItem('sessionId', sessionTok);
    if (deviceFingerprint) {
      localStorage.setItem('deviceFingerprint', deviceFingerprint);
    }
    
    setRefreshToken(refreshTok);
    setSessionId(sessionTok);
    
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      startTokenRefreshTimer();
      return true;
    } catch (error) {
      console.error("Login failed", error);
      logout();
      return false;
    }
  };

  const logout = () => {
    const sessionTok = localStorage.getItem('sessionId');
    
    // Call logout endpoint to invalidate tokens on server
    if (sessionTok) {
      api.post('/auth/logout', { sessionId: sessionTok }).catch(err => 
        console.error("Error logging out on server", err)
      );
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('deviceFingerprint');
    
    setUser(null);
    setRefreshToken(null);
    setSessionId(null);
    
    if (tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer);
      setTokenRefreshTimer(null);
    }
  };

  const value = {
    user,
    loading,
    loginWithToken,
    logout,
    refreshAccessToken,
    sessionId,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
