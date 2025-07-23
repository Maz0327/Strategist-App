import { apiRequest } from "./queryClient";
import type { LoginData, RegisterData, User } from "@shared/schema";

export interface AuthResponse {
  success: boolean;
  user: {
    id: number;
    email: string;
  };
}

export class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/login", data);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Login failed');
    }
    return { success: true, user: result.data };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/register", data);
    return response.json();
  }

  async logout(): Promise<void> {
    await apiRequest("POST", "/api/auth/logout");
  }

  async getCurrentUser(): Promise<{ user: { id: number; email: string } }> {
    const response = await apiRequest("GET", "/api/auth/me");
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Not authenticated');
    }
    return { user: result.data };
  }
}

export const authService = new AuthService();
