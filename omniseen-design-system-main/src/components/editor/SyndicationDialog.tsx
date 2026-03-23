import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Send,
  Settings,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  useSyndication,
  type SyndicationPlatform,
  type SyndicateArticleParams,
} from "@/hooks/useSyndication";

interface SyndicationDialogProps {
  blogId: string;
  articleId: string;
  title: string;
  content: string;
  canonicalUrl?: string;
  tags?: string[];
  onClose: () => void;
}

export default function SyndicationDialog({
  blogId,
  articleId,
  title,
  content,
  canonicalUrl,
  tags,
  onClose,
}: SyndicationDialogProps) {
  const {
    platforms,
    results,
    publishing,
    enabledCount,
    updatePlatform,
    syndicate,
  } = useSyndication(blogId);

  const [expandedPlatform, setExpandedPlatform] = useState<SyndicationPlatform | null>(null);
  const [view, setView] = useState<"config" | "publish">("config");

  const handleSyndicate = async () => {
    setView("publish");
    await syndicate({
      articleId,
      title,
      content,
      canonicalUrl,
      tags,
    });
  };

  const hasResults = results.length > 0;
  const allDone = results.length > 0 && results.every((r) => r.status === "success" || r.status === "error");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-space-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-space-5">
          <h3 className="text-h3 text-foreground flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Syndication
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {view === "config" && (
          <div className="space-y-space-4">
            <p className="text-body-sm text-muted-foreground">
              Distribua seu artigo automaticamente para múltiplas plataformas.
              Configure os tokens de cada plataforma abaixo.
            </p>

            {/* Platform list */}
            <div className="space-y-2">
              {platforms.map((platform) => (
                <div
                  key={platform.platform}
                  className={`border rounded-lg transition-colors ${
                    platform.enabled
                      ? "border-primary/30 bg-primary/5"
                      : "border-border"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 p-3">
                    <span className="text-xl">{platform.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-foreground">
                        {platform.label}
                      </p>
                      <p className="text-tiny text-muted-foreground">{platform.description}</p>
                    </div>
                    <Switch
                      checked={platform.enabled}
                      onCheckedChange={(enabled) =>
                        updatePlatform(platform.platform, { enabled })
                      }
                    />
                    <button
                      onClick={() =>
                        setExpandedPlatform(
                          expandedPlatform === platform.platform ? null : platform.platform,
                        )
                      }
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      {expandedPlatform === platform.platform ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Config fields */}
                  {expandedPlatform === platform.platform && (
                    <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                      {platform.fields.map((field) => (
                        <div key={field.key}>
                          <label className="text-caption text-muted-foreground mb-1 block font-medium">
                            {field.label}
                          </label>
                          <Input
                            type={field.type || (field.key.toLowerCase().includes("token") || field.key.toLowerCase().includes("password") ? "password" : "text")}
                            value={
                              field.key === "token"
                                ? platform.token
                                : platform.extraConfig[field.key] ?? ""
                            }
                            onChange={(e) => {
                              if (field.key === "token") {
                                updatePlatform(platform.platform, {
                                  token: e.target.value,
                                });
                              } else {
                                updatePlatform(platform.platform, {
                                  extraConfig: {
                                    ...platform.extraConfig,
                                    [field.key]: e.target.value,
                                  },
                                });
                              }
                            }}
                            placeholder={field.placeholder}
                            className="text-body-sm"
                          />
                        </div>
                      ))}
                      {platform.enabled && !platform.token && (
                        <p className="text-tiny text-warning flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Token necessário para publicar
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-space-3 pt-space-3">
              <Button
                onClick={handleSyndicate}
                disabled={enabledCount === 0 || publishing}
                className="flex-1 h-[48px]"
              >
                <Send className="h-4 w-4 mr-2" />
                Distribuir para {enabledCount} plataforma{enabledCount !== 1 ? "s" : ""}
              </Button>
              <Button variant="outline" onClick={onClose} className="h-[48px]">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {view === "publish" && (
          <div className="space-y-space-4">
            <p className="text-body-sm text-muted-foreground mb-space-3">
              {allDone
                ? "Syndication concluída!"
                : "Distribuindo artigo..."}
            </p>

            {/* Results */}
            <div className="space-y-2">
              {results.map((result) => {
                const platform = platforms.find((p) => p.platform === result.platform);
                if (!platform) return null;

                return (
                  <div
                    key={result.platform}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      result.status === "success"
                        ? "border-success/30 bg-success/5"
                        : result.status === "error"
                          ? "border-destructive/30 bg-destructive/5"
                          : result.status === "publishing"
                            ? "border-primary/30 bg-primary/5"
                            : "border-border"
                    }`}
                  >
                    <span className="text-xl">{platform.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-foreground">
                        {platform.label}
                      </p>
                      {result.status === "publishing" && (
                        <p className="text-tiny text-primary flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Publicando...
                        </p>
                      )}
                      {result.status === "success" && (
                        <p className="text-tiny text-success flex items-center gap-1">
                          <Check className="h-3 w-3" /> Publicado com sucesso
                        </p>
                      )}
                      {result.status === "error" && (
                        <p className="text-tiny text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {result.error}
                        </p>
                      )}
                      {result.status === "pending" && (
                        <p className="text-tiny text-muted-foreground">Aguardando...</p>
                      )}
                    </div>
                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {allDone && (
              <div className="flex gap-space-3 pt-space-3">
                <Button onClick={() => setView("config")} variant="outline" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" /> Configurações
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Fechar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
