import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../../types';

// zustand needs to be added to dependencies
// We'll use localStorage directly to keep the bundle lean
interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

// Simple store without zustand for now — using localStorage
function createAuthStore() {
  let _token: string | null = localStorage.getItem('auth_token');
  let _user: User | null = (() => {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const listeners = new Set<() => void>();

  const getState = () => ({ token: _token, user: _user });

  const setState = (token: string | null, user: User | null) => {
    _token = token;
    _user = user;
    if (token && user) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    listeners.forEach((l) => l());
  };

  return {
    getState,
    setAuth: (token: string, user: User) => setState(token, user),
    logout: () => setState(null, null),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const store = createAuthStore();

// Export a zustand-like hook using React useSyncExternalStore pattern
import { useSyncExternalStore } from 'react';

export function useAuthStore<T>(selector: (state: { token: string | null; user: User | null }) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

// Direct access for non-hook usage (interceptors, etc.)
useAuthStore.getState = store.getState;
useAuthStore.setAuth = store.setAuth;
useAuthStore.logout = store.logout;
