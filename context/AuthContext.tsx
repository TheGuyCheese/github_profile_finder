'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    // In a real app, this would be an API call
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(
      (u: User) => (u.email === usernameOrEmail || u.username === usernameOrEmail) && u.password === password
    );

    if (user) {
      const userData = {
        username: user.username,
        email: user.email,
        favorites: user.favorites || [],
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const signup = async (username: string, email: string, password: string) => {
    // In a real app, this would be an API call
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if username or email already exists
    const existingUser = users.find(
      (u: User) => u.email === email || u.username === username
    );
    
    if (existingUser) {
      return {
        success: false,
        error: 'Username or email already exists'
      };
    }

    const newUser = {
      username,
      email,
      password,
      favorites: [],
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const userData = {
      username,
      email,
      favorites: [],
    };
    
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const addToFavorites = (username: string) => {
    if (user) {
      const updatedFavorites = [...user.favorites, username];
      const updatedUser = { ...user, favorites: updatedFavorites };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update in users array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map((u: User) =>
        u.email === user.email ? { ...u, favorites: updatedFavorites } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
  };

  const removeFromFavorites = (username: string) => {
    if (user) {
      const updatedFavorites = user.favorites.filter(fav => fav !== username);
      const updatedUser = { ...user, favorites: updatedFavorites };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update in users array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map((u: User) =>
        u.email === user.email ? { ...u, favorites: updatedFavorites } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup,
        logout,
        addToFavorites,
        removeFromFavorites,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
