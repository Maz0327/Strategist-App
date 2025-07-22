import { Router } from "express";
import { loginSchema, registerSchema } from "@shared/schema";
import { authService } from "../services/auth";

const r = Router();

// POST /api/auth/login
r.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await authService.login(data);
  req.session.userId = user.id;
  res.json({ user });
});

// POST /api/auth/register
r.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);
  const user = await authService.register(data);
  req.session.userId = user.id;
  res.json({ user });
});

// POST /api/auth/logout
r.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// GET  /api/auth/me
r.get("/me", (req, res) => {
  res.json({ userId: req.session.userId ?? null });
});

export default r;
