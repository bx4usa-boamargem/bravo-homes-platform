import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/client/dashboard");
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/client/dashboard`,
      },
    });
    if (error) {
      toast.error("Erro ao conectar com Google: " + error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-space-6">
      <div className="w-full max-w-[400px] bg-card border border-border rounded-lg p-space-7 shadow-md">
        <div className="text-center mb-space-7">
          <div className="flex items-center justify-center gap-space-2 mb-space-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-h2 font-semibold text-primary">Omniseen</span>
          </div>
          <p className="text-body-sm text-muted-foreground">
            {isSignUp ? "Crie sua conta" : "Entre na sua conta"}
          </p>
        </div>

        {/* Google Login */}
        <div className="mb-space-5">
          <Button 
            variant="outline" 
            type="button" 
            className="w-full flex items-center justify-center gap-2 h-11" 
            onClick={handleGoogleLogin} 
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
            )}
            Entrar com Google
          </Button>
        </div>

        <div className="relative mb-space-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-space-5">
          {isSignUp && (
            <div>
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">Nome completo</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" required />
            </div>
          )}
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div>
            <div className="flex items-center justify-between mb-space-2">
              <label className="text-body-sm font-medium text-foreground block">Senha</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-body-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSignUp ? "Criar conta" : "Entrar"}
          </Button>
        </form>

        <div className="mt-space-5 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-body-sm text-primary hover:underline"
          >
            {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar agora"}
          </button>
        </div>
      </div>
    </div>
  );
}
