import { AuthForm } from "@/components/auth-form";

interface AuthPageProps {
  onAuthSuccess: (user: { id: number; email: string }) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  return <AuthForm onAuthSuccess={onAuthSuccess} />;
}
