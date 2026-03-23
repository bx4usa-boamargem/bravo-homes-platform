import { useState } from "react";
import { Youtube, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface YouTubeEmbedDialogProps {
  focusKeyword: string;
  onInsertEmbed: (embedHtml: string) => void;
  onClose: () => void;
}

export default function YouTubeEmbedDialog({
  focusKeyword,
  onInsertEmbed,
  onClose,
}: YouTubeEmbedDialogProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [searchResults, setSearchResults] = useState<{ videoId: string; title: string; thumbnail: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"url" | "search">("url");

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
      /(?:youtu\.be\/)([^?\s]+)/,
      /(?:youtube\.com\/embed\/)([^?\s]+)/,
      /(?:youtube\.com\/shorts\/)([^?\s]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const insertByUrl = () => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return;
    }
    const embedHtml = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1.5em 0"><iframe src="https://www.youtube.com/embed/${videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    onInsertEmbed(embedHtml);
    onClose();
  };

  const searchYouTube = async () => {
    setLoading(true);
    try {
      // Use YouTube oEmbed API for basic discovery (no API key needed for embed data)
      // For search, we'll generate suggested queries instead
      const queries = [
        focusKeyword,
        `${focusKeyword} tutorial`,
        `${focusKeyword} explicação`,
        `como ${focusKeyword}`,
      ];

      // Generate placeholder results with search links
      const results = queries.map((q, i) => ({
        videoId: "",
        title: q,
        thumbnail: "",
        searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
      }));

      setSearchResults(results as any);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-space-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-space-5">
          <h3 className="text-h3 text-foreground flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Inserir Vídeo do YouTube
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 bg-muted rounded-md p-1 mb-space-5">
          <button
            onClick={() => setMode("url")}
            className={`flex-1 py-2 text-body-sm font-medium rounded transition-colors ${
              mode === "url" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Colar URL
          </button>
          <button
            onClick={() => { setMode("search"); searchYouTube(); }}
            className={`flex-1 py-2 text-body-sm font-medium rounded transition-colors ${
              mode === "search" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Buscar Vídeos
          </button>
        </div>

        {mode === "url" ? (
          <div className="space-y-space-4">
            <div>
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">
                URL do YouTube
              </label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                onKeyDown={(e) => e.key === "Enter" && insertByUrl()}
              />
            </div>

            {/* Preview */}
            {extractVideoId(videoUrl) && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img
                  src={`https://img.youtube.com/vi/${extractVideoId(videoUrl)}/mqdefault.jpg`}
                  alt="Thumbnail"
                  className="w-full"
                />
              </div>
            )}

            <Button
              onClick={insertByUrl}
              disabled={!extractVideoId(videoUrl)}
              className="w-full h-[48px]"
            >
              <Plus className="h-4 w-4 mr-2" /> Inserir Embed
            </Button>
          </div>
        ) : (
          <div className="space-y-space-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <p className="text-caption text-muted-foreground">
                  Pesquise no YouTube e cole a URL do vídeo escolhido:
                </p>
                {searchResults.map((result, i) => (
                  <a
                    key={i}
                    href={(result as any).searchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(result.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-red-400/30 hover:bg-red-500/5 transition-colors group"
                  >
                    <Youtube className="h-5 w-5 text-red-500 shrink-0" />
                    <span className="text-body-sm text-foreground group-hover:text-red-400 transition-colors">
                      Buscar: "{result.title}"
                    </span>
                  </a>
                ))}
                <div className="mt-space-4">
                  <label className="text-caption text-muted-foreground mb-space-2 block">Depois cole a URL aqui:</label>
                  <div className="flex gap-2">
                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Cole a URL do YouTube..."
                      className="flex-1"
                    />
                    <Button onClick={insertByUrl} disabled={!extractVideoId(videoUrl)} size="sm">
                      Inserir
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
