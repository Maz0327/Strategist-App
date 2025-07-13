import bcrypt from "bcryptjs";
import { storage } from "../storage";
import type { InsertUser, User, LoginData, RegisterData } from "@shared/schema";

export class AuthService {
  private loginAttempts = new Map<string, { attempts: number; lastAttempt: number }>();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  async register(data: RegisterData): Promise<User> {
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Use stronger hashing with higher salt rounds
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const userData: InsertUser = {
      email: data.email,
      password: hashedPassword,
    };

    return await storage.createUser(userData);
  }

  async login(data: LoginData): Promise<User> {
    const email = data.email.toLowerCase();
    
    // Check for rate limiting
    const attempts = this.loginAttempts.get(email);
    if (attempts && attempts.attempts >= this.MAX_LOGIN_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      if (timeSinceLastAttempt < this.LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((this.LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
        throw new Error(`Account temporarily locked. Try again in ${remainingTime} minutes.`);
      } else {
        // Reset attempts after lockout period
        this.loginAttempts.delete(email);
      }
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      this.recordFailedAttempt(email);
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      this.recordFailedAttempt(email);
      throw new Error("Invalid credentials");
    }

    // Clear failed attempts on successful login
    this.loginAttempts.delete(email);
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
