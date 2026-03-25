"use client";

import { useState, useEffect } from 'react';
import { MOCK_USERS, User, Role } from '@/lib/mock-data';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Simulate local storage or auth state
    const savedUser = localStorage.getItem('ais_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Default to student for first visit
      setUser(MOCK_USERS[1]);
    }
  }, []);

  const loginAs = (role: Role) => {
    const newUser = role === 'professor' ? MOCK_USERS[0] : MOCK_USERS[1];
    setUser(newUser);
    localStorage.setItem('ais_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ais_user');
  };

  return { user, loginAs, logout };
}
