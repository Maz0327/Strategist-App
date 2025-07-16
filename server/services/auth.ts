import bcrypt from "bcryptjs";
import { storage } from "../storage";
import type { InsertUser, User, LoginData, RegisterData } from "@shared/schema";

export class AuthService {
  private loginAttempts = new Map<string, { attempts: number; lastAttempt: number }>();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  async register(data: RegisterData & { role?: string }): Promise<User> {
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      const error = new Error("An account with this email already exists");
      error.name = "EMAIL_ALREADY_EXISTS";
      throw error;
    }

    // Use stronger hashing with higher salt rounds
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const userData: InsertUser = {
      email: data.email,
      username: data.username || data.email.split('@')[0],
      password: hashedPassword,
      role: data.role || "user",
    };

    return await storage.createUser(userData);
  }

  async login(data: LoginData): Promise<User> {
    const emailOrUsername = data.email.toLowerCase();
    
    // Check for rate limiting
    const attempts = this.loginAttempts.get(emailOrUsername);
    if (attempts && attempts.attempts >= this.MAX_LOGIN_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      if (timeSinceLastAttempt < this.LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((this.LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
        throw new Error(`Account temporarily locked. Try again in ${remainingTime} minutes.`);
      } else {
        // Reset attempts after lockout period
        this.loginAttempts.delete(emailOrUsername);
      }
    }

    // Support both email and username login - but don't lowercase the original input for username lookup
    const user = await storage.getUserByEmailOrUsername(data.email);
    if (!user) {
      this.recordFailedAttempt(emailOrUsername);
      const error = new Error("The email or password you entered is incorrect");
      error.name = "INVALID_CREDENTIALS";
      throw error;
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      this.recordFailedAttempt(emailOrUsername);
      const error = new Error("The email or password you entered is incorrect");
      error.name = "INVALID_CREDENTIALS";
      throw error;
    }

    // Clear failed attempts on successful login
    this.loginAttempts.delete(emailOrUsername);
    return user;
  }

  private recordFailedAttempt(email: string): void {
    const attempts = this.loginAttempts.get(email) || { attempts: 0, lastAttempt: 0 };
    attempts.attempts++;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(email, attempts);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return await storage.getUser(id);
  }
}

export const authService = new AuthService();
