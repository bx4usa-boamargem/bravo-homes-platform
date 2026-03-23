import { Check, ExternalLink, Globe, Loader2 } from "lucide-react";
import type { ExternalLinkSuggestion } from "@/hooks/useExternalLinks";

interface ExternalLinkSuggestionsProps {
  suggestions: ExternalLinkSuggestion[];
  loading: boolean;
  onInsertLink: (url: string, text: string) => void;
}

export default function ExternalLinkSuggestions({
  suggestions,
  loading,
  onInsertLink,
}: ExternalLinkSuggestionsProps) {
  if (loading && suggestions.length === 0) {
    return (
      <div className="px-space-5 py-space-4">
        <div className="flex items-center gap-2 text-body font-semibold text-foreground mb-space-3">
          <Globe className="h-4 w-4" />
          Links Externos
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />
        </div>
        <p className="text-caption text-muted-foreground">Buscando fontes externas...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="px-space-5 py-space-4">
        <div className="flex items-center gap-2 text-body font-semibold text-foreground mb-space-2">
          <Globe className="h-4 w-4" />
          Links Externos
        </div>
        <p className="text-caption text-muted-foreground">
          Nenhuma sugestão de link externo encontrada.
        </p>
      </div>
    );
  }

  const notLinked = suggestions.filter((s) => !s.alreadyLinked);
  const alreadyLinked = suggestions.filter((s) => s.alreadyLinked);

  return (
    <div className="px-space-5 py-space-4">
      <div className="flex items-center gap-2 text-body font-semibold text-foreground mb-space-3">
        <Globe className="h-4 w-4" />
        Links Externos
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />}
        {!loading && (
          <span className="text-caption text-muted-foreground font-normal ml-auto">
            {notLinked.length} fonte{notLinked.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {notLinked.map((s, i) => (
          <button
            key={`${s.url}-${i}`}
            onClick={() => onInsertLink(s.url, s.anchorText)}
            className="w-full text-left p-2.5 rounded-md border border-border hover:border-blue-400/30 hover:bg-blue-500/5 transition-colors group"
          >
            <p className="text-body-sm font-medium text-foreground line-clamp-1 group-hover:text-blue-400 transition-colors">
              {s.title}
            </p>
            {s.snippet && (
              <p className="text-tiny text-muted-foreground mt-0.5 line-clamp-1">{s.snippet}</p>
            )}
            <p className="text-tiny text-muted-foreground mt-1 flex items-center gap-1 font-mono truncate">
              <ExternalLink className="h-3 w-3 shrink-0" />
              {s.url.replace(/^https?:\/\//, "").slice(0, 40)}
            </p>
            <p className="text-tiny text-blue-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Clique para inserir → "{s.anchorText}"
            </p>
          </button>
        ))}

        {alreadyLinked.length > 0 && (
          <>
            <p className="text-tiny text-muted-foreground mt-space-3 mb-1 font-medium uppercase tracking-wider">
              Já referenciados
            </p>
            {alreadyLinked.map((s, i) => (
              <div
                key={`${s.url}-${i}`}
                className="w-full text-left p-2.5 rounded-md bg-muted/50 opacity-60"
              >
                <p className="text-body-sm text-foreground line-clamp-1 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success shrink-0" />
                  {s.title}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
