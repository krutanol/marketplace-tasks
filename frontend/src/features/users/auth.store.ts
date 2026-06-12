import { useSyncExternalStore } from 'react';
import type { User } from '../../types';

interface AuthState {
  token: string | null;
  user: User | null;
}

function createAuthStore() {
  let _token: string | null = localStorage.getItem('auth_token');
  let _user: User | null = (() => {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  })();

  const listeners = new Set<() => void>();

  const getState = (): AuthState => ({ token: _token, user: _user });

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

export function useAuthStore<T>(selector: (state: AuthState) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

useAuthStore.getState = store.getState;
useAuthStore.setAuth = store.setAuth;
useAuthStore.logout = store.logout;
