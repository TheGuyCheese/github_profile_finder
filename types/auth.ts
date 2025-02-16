export interface User {
  username: string;
  email: string;
  password?: string;
  favorites: string[];
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<AuthResult>;
  signup: (username: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  addToFavorites: (username: string) => void;
  removeFromFavorites: (username: string) => void;
}
