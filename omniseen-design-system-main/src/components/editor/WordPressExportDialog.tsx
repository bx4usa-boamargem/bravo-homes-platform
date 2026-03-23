import { useState } from "react";
import { Globe, Loader2, Check, X, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WordPressExportDialogProps {
  articleId: string;
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  featuredImageUrl: string | null;
  onClose: () => void;
}

export default function WordPressExportDialog({
  articleId,
  title,
  content,
  metaTitle,
  metaDescription,
  slug,
  featuredImageUrl,
  onClose,
}: WordPressExportDialogProps) {
  const [wpUrl, setWpUrl] = useState("");
  const [wpUser, setWpUser] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [method, setMethod] = useState<"api" | "copy">("api");

  const publishToWordPress = async () => {
    if (!wpUrl || !wpUser || !wpAppPassword) {
      toast.error("Preencha URL, usuário e Application Password");
      return;
    }

    setPublishing(true);
    try {
      // Call edge function to publish
      const { data, error } = await supabase.functions.invoke("publish-to-cms", {
        body: {
          article_id: articleId,
          platform: "wordpress",
          wp_url: wpUrl.replace(/\/$/, ""),
          wp_user: wpUser,
          wp_app_password: wpAppPassword,
          title,
          content,
          slug,
          meta_title: metaTitle,
          meta_description: metaDescription,
          featured_image_url: featuredImageUrl,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.url) {
        setPublishedUrl(data.url);
        setPublished(true);
        toast.success("Artigo publicado no WordPress!");
      } else if (data?.id) {
        setPublished(true);
        toast.success("Artigo criado no WordPress como rascunho!");
      } else {
        toast.info("Publicação enviada — verifique o WordPress");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao publicar: ${msg}`);
    } finally {
      setPublishing(false);
    }
  };

  const copyAsHtml = () => {
    navigator.clipboard.writeText(content);
    toast.success("HTML copiado para a área de transferência!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-space-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-space-5">
          <h3 className="text-h3 text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Exportar para WordPress
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {published ? (
          <div className="space-y-space-4">
            <div className="flex items-center gap-2 text-success bg-success/5 rounded-lg px-4 py-3 border border-success/20">
              <Check className="h-5 w-5 shrink-0" />
              <span className="text-body-sm font-medium">Artigo publicado com sucesso!</span>
            </div>
            {publishedUrl && (
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-body-sm"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir no WordPress
              </a>
            )}
            <Button variant="outline" onClick={onClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-space-5">
            {/* Method tabs */}
            <div className="flex gap-2 bg-muted rounded-md p-1">
              <button
                onClick={() => setMethod("api")}
                className={`flex-1 py-2 text-body-sm font-medium rounded transition-colors ${
                  method === "api" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Via API REST
              </button>
              <button
                onClick={() => setMethod("copy")}
                className={`flex-1 py-2 text-body-sm font-medium rounded transition-colors ${
                  method === "copy" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Copiar HTML
              </button>
            </div>

            {method === "api" ? (
              <>
                <div>
                  <label className="text-body-sm font-medium text-foreground mb-space-2 block">
                    URL do WordPress
                  </label>
                  <Input
                    value={wpUrl}
                    onChange={(e) => setWpUrl(e.target.value)}
                    placeholder="https://meusite.com.br"
                  />
                </div>
                <div>
                  <label className="text-body-sm font-medium text-foreground mb-space-2 block">
                    Usuário
                  </label>
                  <Input
                    value={wpUser}
                    onChange={(e) => setWpUser(e.target.value)}
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="text-body-sm font-medium text-foreground mb-space-2 block">
                    Application Password
                  </label>
                  <Input
                    type="password"
                    value={wpAppPassword}
                    onChange={(e) => setWpAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  />
                  <p className="text-caption text-muted-foreground mt-1">
                    Gere em WordPress → Usuários → Perfil → Application Passwords
                  </p>
                </div>

                <Button
                  onClick={publishToWordPress}
                  disabled={publishing || !wpUrl || !wpUser || !wpAppPassword}
                  className="w-full h-[48px]"
                >
                  {publishing ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Publicando...</>
                  ) : (
                    <><Globe className="h-4 w-4 mr-2" /> Publicar no WordPress</>
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-body-sm text-muted-foreground">
                  Copie o HTML do artigo e cole diretamente no editor do WordPress.
                </p>
                <div className="bg-muted rounded-lg p-4 max-h-[200px] overflow-auto">
                  <pre className="text-tiny text-muted-foreground font-mono whitespace-pre-wrap break-words">
                    {content.slice(0, 500)}...
                  </pre>
                </div>
                <Button onClick={copyAsHtml} className="w-full h-[48px]" variant="outline">
                  <Copy className="h-4 w-4 mr-2" /> Copiar HTML Completo
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
