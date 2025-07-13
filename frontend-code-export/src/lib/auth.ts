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
    return response.json();
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
    return response.json();
  }
}

export const authService = new AuthService();
