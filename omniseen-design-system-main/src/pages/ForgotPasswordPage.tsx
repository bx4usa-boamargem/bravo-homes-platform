import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Se o email estiver cadastrado, você receberá um link para redefinir a senha.");
    }
    
    setLoading(false);
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
            Esqueceu sua senha?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-space-5">
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">Email</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="seu@email.com" 
              required 
            />
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar link de recuperação
          </Button>
        </form>

        <div className="mt-space-5 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-body-sm text-primary hover:underline flex items-center justify-center gap-2 w-full"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
}
