"use client";

import { useState, useEffect } from 'react';
import { MOCK_USERS, User, Role } from '@/lib/mock-data';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('ais_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email: string) => {
    // Determine role based on email pattern
    let role: Role = 'student';
    let name = email.split('@')[0];
    
    // Specific student email
    if (email === '24bds001@iiitdwd.ac.in') {
      role = 'student';
      name = 'Aryan Sharma';
    } 
    // Teacher pattern: name@iiitdwd.ac.in
    else if (email.endsWith('@iiitdwd.ac.in')) {
      role = 'professor';
      name = name.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    } else {
      throw new Error('Please use your IIIT Dharwad email address.');
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      email: email,
      role: role,
      avatar: `https://picsum.photos/seed/${name}/100/100`
    };

    setUser(newUser);
    localStorage.setItem('ais_user', JSON.stringify(newUser));
    return newUser;
  };

  const loginAs = (role: Role) => {
    const newUser = role === 'professor' ? MOCK_USERS[0] : MOCK_USERS[1];
    setUser(newUser);
    localStorage.setItem('ais_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ais_user');
  };

  return { user, login, loginAs, logout, loading };
}
