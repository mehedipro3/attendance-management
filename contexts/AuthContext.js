import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import ApiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      // Check if this is a fresh app start (no previous session)
      const hasPreviousSession = await SecureStore.getItemAsync('hasPreviousSession');
      
      if (!hasPreviousSession) {
        // First time opening the app, don't auto-login
        console.log('Fresh app start - skipping auto-login');
        await SecureStore.setItemAsync('hasPreviousSession', 'true');
        setLoading(false);
        return;
      }
      
      const storedToken = await SecureStore.getItemAsync('authToken');
      if (storedToken) {
        try {
          const response = await ApiService.verifyToken(storedToken);
          if (response.success) {
            setToken(storedToken);
            setUser(response.user);
            console.log('Auto-login successful');
          } else {
            // Token is invalid, clear it
            await SecureStore.deleteItemAsync('authToken');
            console.log('Invalid token - cleared');
          }
        } catch (error) {
          // Token verification failed, clear it
          await SecureStore.deleteItemAsync('authToken');
          console.log('Token verification failed - cleared:', error.message);
        }
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await ApiService.login(email, password);
      if (response.success) {
        setUser(response.user);
        setToken(response.token);
        await SecureStore.setItemAsync('authToken', response.token);
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const registerStudent = async (email, password, name, studentId, intake, section, department) => {
    try {
      const response = await ApiService.registerStudent(email, password, name, studentId, intake, section, department);
      if (response.success) {
        // Don't automatically log in after registration
        // Just return success - user will need to login manually
        return { success: true, message: 'Student registration successful! Please login with your credentials.' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('hasPreviousSession');
      setUser(null);
      setToken(null);
      console.log('User logged out - session cleared');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    registerStudent,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
