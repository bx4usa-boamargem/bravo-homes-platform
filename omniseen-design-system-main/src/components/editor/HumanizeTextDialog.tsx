import { useState } from "react";
import { Bot, Loader2, X, Wand2, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HumanizeTextDialogProps {
  articleId: string;
  blogId: string;
  currentContent: string;
  focusKeyword: string;
  onApply: (newContent: string) => void;
  onClose: () => void;
}

type HumanizeLevel = "light" | "medium" | "aggressive";

const LEVELS: { value: HumanizeLevel; label: string; description: string; icon: string }[] = [
  {
    value: "light",
    label: "Leve",
    description: "Ajusta pequenas repetições e padrões robóticos. Mantém estilo original.",
    icon: "🔵",
  },
  {
    value: "medium",
    label: "Moderado",
    description: "Varia estrutura de frases, adiciona expressões informais e transições naturais.",
    icon: "🟡",
  },
  {
    value: "aggressive",
    label: "Agressivo",
    description: "Reescreve parágrafos inteiros, troca vocabulário e adiciona imperfeições humanas.",
    icon: "🔴",
  },
];

export default function HumanizeTextDialog({
  articleId,
  blogId,
  currentContent,
  focusKeyword,
  onApply,
  onClose,
}: HumanizeTextDialogProps) {
  const [level, setLevel] = useState<HumanizeLevel>("medium");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleHumanize = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("improve-article", {
        body: {
          article_id: articleId,
          blog_id: blogId,
          mode: "humanize",
          humanize_level: level,
          content: currentContent,
          focus_keyword: focusKeyword,
          language: "pt-br",
        },
      });

      if (error) throw new Error(error.message);
      if (data?.content) {
        setResult(data.content);
        setPreviewMode(true);
      } else {
        toast.info("Conteúdo processado — verifique o resultado");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao humanizar: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  const applyResult = () => {
    if (result) {
      onApply(result);
      toast.success("Texto humanizado aplicado!");
      onClose();
    }
  };

  // Word count comparison
  const originalWords = currentContent.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  const resultWords = result
    ? result.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-space-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-space-5">
          <h3 className="text-h3 text-foreground flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Humanizar Texto
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!previewMode ? (
          <div className="space-y-space-5">
            <p className="text-body-sm text-muted-foreground">
              Remove padrões de escrita de IA para tornar o texto mais natural e humano,
              passando em detectores como GPTZero e Originality.ai.
            </p>

            {/* Level selection */}
            <div className="space-y-2">
              <label className="text-body-sm font-medium text-foreground">
                Nível de humanização
              </label>
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    level === l.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{l.icon}</span>
                    <span className="text-body-sm font-medium text-foreground">{l.label}</span>
                  </div>
                  <p className="text-caption text-muted-foreground mt-1 ml-6">{l.description}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-caption text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <Bot className="h-4 w-4 shrink-0" />
              <span>O artigo tem <strong className="text-foreground">{originalWords}</strong> palavras. O processo mantém o conteúdo SEO intacto.</span>
            </div>

            <Button
              onClick={handleHumanize}
              disabled={processing}
              className="w-full h-[48px]"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Humanizando...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Humanizar Texto
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-space-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-caption text-muted-foreground">Original</p>
                <p className="text-h3 font-bold text-foreground">{originalWords}</p>
                <p className="text-tiny text-muted-foreground">palavras</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/20">
                <p className="text-caption text-primary">Humanizado</p>
                <p className="text-h3 font-bold text-primary">{resultWords}</p>
                <p className="text-tiny text-muted-foreground">palavras</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-caption text-success bg-success/5 rounded-lg px-3 py-2 border border-success/20">
              <Check className="h-4 w-4 shrink-0" />
              <span>Texto humanizado com sucesso! Revise e aplique.</span>
            </div>

            <div className="flex gap-space-3">
              <Button onClick={applyResult} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Aplicar
              </Button>
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                Refazer
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
