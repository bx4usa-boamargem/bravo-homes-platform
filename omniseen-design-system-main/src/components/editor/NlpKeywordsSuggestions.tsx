import { useState } from "react";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface NlpKeywordsSuggestionsProps {
  keyword: string;
  blogId: string;
  selectedKeywords: string[];
  onAddKeyword: (keyword: string) => void;
  onRemoveKeyword: (keyword: string) => void;
}

// Common modifier patterns for NLP keyword expansion
const NLP_MODIFIERS = {
  "pt-br": {
    prefixes: ["como", "o que é", "por que", "quando usar", "melhor", "guia de", "dicas de"],
    suffixes: ["para iniciantes", "passo a passo", "em 2025", "grátis", "dicas", "exemplos", "estratégias"],
    related: ["ferramentas de", "benefícios de", "como funciona", "tipos de", "melhores práticas"],
  },
};

export default function NlpKeywordsSuggestions({
  keyword,
  blogId,
  selectedKeywords,
  onAddKeyword,
  onRemoveKeyword,
}: NlpKeywordsSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateSuggestions = async () => {
    if (!keyword.trim()) return;
    setLoading(true);

    try {
      // 1. Generate local NLP variations
      const localSuggestions = new Set<string>();
      const mod = NLP_MODIFIERS["pt-br"];
      const kw = keyword.toLowerCase().trim();

      mod.prefixes.forEach((p) => localSuggestions.add(`${p} ${kw}`));
      mod.suffixes.forEach((s) => localSuggestions.add(`${kw} ${s}`));
      mod.related.forEach((r) => localSuggestions.add(`${r} ${kw}`));

      // 2. Fetch secondary keywords from related articles in the same blog
      const { data: articles } = await supabase
        .from("articles")
        .select("secondary_keywords, focus_keyword")
        .eq("blog_id", blogId)
        .neq("focus_keyword", keyword)
        .limit(20);

      if (articles) {
        for (const article of articles) {
          const articleKws = article.secondary_keywords || [];
          for (const skw of articleKws) {
            if (
              typeof skw === "string" &&
              skw.toLowerCase().includes(kw.split(" ")[0]) // Match on first word
            ) {
              localSuggestions.add(skw.toLowerCase());
            }
          }
          // Also suggest the focus keywords of related articles
          if (article.focus_keyword && article.focus_keyword.toLowerCase() !== kw) {
            const fkw = article.focus_keyword.toLowerCase();
            // Only if there's some word overlap
            const kwWords = kw.split(/\s+/);
            const fkwWords = fkw.split(/\s+/);
            if (kwWords.some((w: string) => fkwWords.includes(w))) {
              localSuggestions.add(fkw);
            }
          }
        }
      }

      // 3. Remove the primary keyword itself and already selected ones
      localSuggestions.delete(kw);
      selectedKeywords.forEach((sk) => localSuggestions.delete(sk.toLowerCase()));

      setSuggestions(Array.from(localSuggestions).slice(0, 20));
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  if (!generated) {
    return (
      <div className="mt-space-4">
        <Button
          variant="outline"
          size="sm"
          onClick={generateSuggestions}
          disabled={loading || !keyword.trim()}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Sugerir Keywords NLP
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-space-4 space-y-space-3">
      {/* Selected keywords */}
      {selectedKeywords.length > 0 && (
        <div>
          <p className="text-caption text-muted-foreground mb-space-2 font-medium">Keywords selecionadas:</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-tiny font-medium"
              >
                {kw}
                <button
                  onClick={() => onRemoveKeyword(kw)}
                  className="hover:text-primary/60"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-space-2">
            <p className="text-caption text-muted-foreground font-medium">Sugestões NLP:</p>
            <button
              onClick={generateSuggestions}
              className="text-tiny text-primary hover:underline"
            >
              Regenerar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions
              .filter((s) => !selectedKeywords.includes(s))
              .map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onAddKeyword(suggestion)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-tiny font-medium hover:bg-primary/10 hover:text-primary transition-colors border border-border"
                >
                  <Plus className="h-3 w-3" />
                  {suggestion}
                </button>
              ))}
          </div>
        </div>
      )}

      {suggestions.length === 0 && (
        <p className="text-caption text-muted-foreground italic">
          Nenhuma sugestão encontrada. Tente uma keyword diferente.
        </p>
      )}
    </div>
  );
}
