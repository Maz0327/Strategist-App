import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { authService } from "@/lib/auth";
import { loginSchema, registerSchema, type LoginData, type RegisterData } from "@shared/schema";
import { Brain } from "lucide-react";
import { useErrorHandling } from "@/hooks/use-error-handling";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useLocation } from "wouter";

interface AuthFormProps {
  onAuthSuccess: (user: { id: number; email: string }) => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const { toast } = useToast();
  const { handleApiError } = useErrorHandling();
  const [, setLocation] = useLocation();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleLogin = async (data: LoginData) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await authService.login(data);
      onAuthSuccess(response.user);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      // Redirect to dashboard after successful login
      setLocation("/dashboard");
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setLoginError(`${errorMessage.title}: ${errorMessage.message}${errorMessage.solution ? '. ' + errorMessage.solution : ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setIsLoading(true);
    setRegisterError(null);
    try {
      const response = await authService.register(data);
      onAuthSuccess(response.user);
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      // Redirect to dashboard after successful registration
      setLocation("/dashboard");
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setRegisterError(`${errorMessage.title}: ${errorMessage.message}${errorMessage.solution ? '. ' + errorMessage.solution : ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center">
            <Brain className="text-white text-2xl" size={32} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Welcome to Strategist
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            AI-powered content analysis for strategic insights
          </p>
        </div>

        <Card className="card-shadow">
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                {loginError && (
                  <ErrorDisplay 
                    error={loginError} 
                    onDismiss={() => setLoginError(null)} 
                    className="mb-4"
                  />
                )}
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      {...loginForm.register("email")}
                      disabled={isLoading}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      {...loginForm.register("password")}
                      disabled={isLoading}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size="sm" /> : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                {registerError && (
                  <ErrorDisplay 
                    error={registerError} 
                    onDismiss={() => setRegisterError(null)} 
                    className="mb-4"
                  />
                )}
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email address</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      {...registerForm.register("email")}
                      disabled={isLoading}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      {...registerForm.register("password")}
                      disabled={isLoading}
                    />
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Password must contain:</p>
                      <ul className="ml-2 space-y-0.5">
                        <li>• At least 8 characters</li>
                        <li>• One uppercase letter (A-Z)</li>
                        <li>• One lowercase letter (a-z)</li>
                        <li>• One number (0-9)</li>
                        <li>• One special character (!@#$%^&*.)</li>
                      </ul>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      {...registerForm.register("confirmPassword")}
                      disabled={isLoading}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size="sm" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
