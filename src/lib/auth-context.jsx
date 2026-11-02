'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, getToken, clearToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (err) {
      console.warn('Session expired or invalid token:', err.message);
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setUser(res.user);
    return res;
  };

  const loginWithOtp = async (email, otp) => {
    const res = await authApi.verifyLoginOTP(email, otp);
    setUser(res.user);
    return res;
  };

  const register = async (nameOrEmail, emailOrPassword, passwordOrToken = null, maybeToken = null) => {
    let payload;
    if (typeof nameOrEmail === 'object' && nameOrEmail !== null) {
      payload = nameOrEmail;
    } else if (maybeToken !== null) {
      // Called with 4 arguments: (name, email, password, token)
      payload = { name: nameOrEmail, email: emailOrPassword, password: passwordOrToken, register_token: maybeToken };
    } else {
      // Called with 2 or 3 arguments: (email, password, register_token)
      payload = { email: nameOrEmail, password: emailOrPassword, register_token: passwordOrToken };
    }
    const res = await authApi.register(payload);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithOtp,
        register,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
