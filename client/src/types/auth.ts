export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string[];
  permissions: string[];
  status: string;
  avatar?: string;
  phone?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setAuthenticated: (status: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}
