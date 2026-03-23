import { Check, ExternalLink, Link2, Loader2 } from "lucide-react";
import type { InternalLinkSuggestion } from "@/hooks/useInternalLinks";

interface InternalLinkSuggestionsProps {
  suggestions: InternalLinkSuggestion[];
  loading: boolean;
  onInsertLink: (url: string, text: string) => void;
}

export default function InternalLinkSuggestions({
  suggestions,
  loading,
  onInsertLink,
}: InternalLinkSuggestionsProps) {
  if (loading && suggestions.length === 0) {
    return (
      <div className="px-space-5 py-space-4">
        <div className="flex items-center gap-2 text-body font-semibold text-foreground mb-space-3">
          <Link2 className="h-4 w-4" />
          Links Internos
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />
        </div>
        <p className="text-caption text-muted-foreground">Analisando conteúdo...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="px-space-5 py-space-4">
        <div className="flex items-center gap-2 text-body font-semibold text-foreground mb-space-2">
          <Link2 className="h-4 w-4" />
          Links Internos
        </div>
        <p className="text-caption text-muted-foreground">
          Nenhuma sugestão encontrada. Escreva mais conteúdo ou publique mais artigos.
        </p>
      </div>
    );
  }

  const notLinked = suggestions.filter((s) => !s.alreadyLinked);
  const alreadyLinked = suggestions.filter((s) => s.alreadyLinked);

  return (
    <div className="px-space-5 py-space-4">
      <div className="flex items-center gap-2 text-body font-semibold text-foreground mb-space-3">
        <Link2 className="h-4 w-4" />
        Links Internos
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />}
        {!loading && (
          <span className="text-caption text-muted-foreground font-normal ml-auto">
            {notLinked.length} sugestão{notLinked.length !== 1 ? "ões" : ""}
          </span>
        )}
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        {notLinked.map((s) => (
          <button
            key={s.articleId}
            onClick={() => onInsertLink(s.url, s.anchorText)}
            className="w-full text-left p-2.5 rounded-md border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors group"
          >
            <p className="text-body-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {s.articleTitle}
            </p>
            <p className="text-tiny text-muted-foreground mt-0.5 flex items-center gap-1">
              <ExternalLink className="h-3 w-3 shrink-0" />
              {s.matchReason}
            </p>
            <p className="text-tiny text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Clique para inserir link → "{s.anchorText}"
            </p>
          </button>
        ))}

        {/* Already linked */}
        {alreadyLinked.length > 0 && (
          <>
            <p className="text-tiny text-muted-foreground mt-space-3 mb-1 font-medium uppercase tracking-wider">
              Já linkados
            </p>
            {alreadyLinked.map((s) => (
              <div
                key={s.articleId}
                className="w-full text-left p-2.5 rounded-md bg-muted/50 opacity-60"
              >
                <p className="text-body-sm text-foreground line-clamp-1 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success shrink-0" />
                  {s.articleTitle}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
