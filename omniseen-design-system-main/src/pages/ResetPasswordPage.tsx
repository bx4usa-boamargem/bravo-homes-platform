import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if the user is actually in a password reset session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError("Sessão de recuperação inválida ou expirada. Solicite um novo link.");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada com sucesso! Você já pode entrar.");
      navigate("/login");
    }
    
    setLoading(false);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-space-6">
        <div className="w-full max-w-[400px] bg-card border border-border rounded-lg p-space-7 shadow-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-h3 font-semibold mb-2">Link Inválido</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate("/forgot-password")} className="w-full">
            Solicitar novo link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-space-6">
      <div className="w-full max-w-[400px] bg-card border border-border rounded-lg p-space-7 shadow-md">
        <div className="text-center mb-space-7">
          <div className="flex items-center justify-center gap-space-2 mb-space-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-h2 font-semibold text-primary">Omniseen</span>
          </div>
          <p className="text-body-sm text-muted-foreground">
            Crie uma nova senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-space-5">
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">Nova Senha</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              minLength={6}
            />
          </div>
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">Confirmar Nova Senha</label>
            <Input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Redefinir senha
          </Button>
        </form>
      </div>
    </div>
  );
}
