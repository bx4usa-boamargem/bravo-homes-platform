import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBlog } from "@/hooks/useBlog";
import { useBulkPipeline, type BulkItem } from "@/hooks/useBulkPipeline";
import { toast } from "sonner";

function StatusIcon({ status }: { status: BulkItem["status"] }) {
  switch (status) {
    case "pending":
      return <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center"><span className="text-tiny text-muted-foreground">⏳</span></div>;
    case "running":
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    case "done":
      return <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>;
    case "error":
      return <div className="h-5 w-5 rounded-full bg-destructive flex items-center justify-center"><XCircle className="h-3 w-3 text-white" /></div>;
  }
}

export default function BulkGenerationPage() {
  const navigate = useNavigate();
  const { blog } = useBlog();
  const { items, stats, isRunning, enqueue, retryFailed, abort, reset } = useBulkPipeline();

  const [keywordsText, setKeywordsText] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [language, setLanguage] = useState("pt-br");
  const [size, setSize] = useState<"short" | "medium" | "long">("medium");
  const [tone, setTone] = useState("profissional e próximo");
  const [includeImages, setIncludeImages] = useState(true);
  const [includeFaq, setIncludeFaq] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasStarted = items.length > 0;
  const allDone = hasStarted && stats.pending === 0 && stats.running === 0;

  // ── Parse keywords from text ─────────────────────────────────────────
  const parseKeywords = (text: string): string[] => {
    return text
      .split(/[\n,;]+/)
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0);
  };

  // ── CSV Upload ────────────────────────────────────────────────────────
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Parse CSV: first column, skip header if detected
      const lines = text.split(/\r?\n/).filter(Boolean);
      const keywords: string[] = [];
      for (const line of lines) {
        const cols = line.split(",");
        const kw = cols[0]?.trim().replace(/^["']|["']$/g, "");
        if (kw && kw.toLowerCase() !== "keyword" && kw.toLowerCase() !== "palavra-chave") {
          keywords.push(kw);
        }
      }
      if (keywords.length > 0) {
        setKeywordsText((prev) => (prev ? `${prev}\n${keywords.join("\n")}` : keywords.join("\n")));
        toast.success(`${keywords.length} keywords importadas do CSV`);
      } else {
        toast.error("Nenhuma keyword encontrada no CSV");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Start generation ──────────────────────────────────────────────────
  const startGeneration = () => {
    if (!blog) return;
    const keywords = parseKeywords(keywordsText);
    if (keywords.length === 0) {
      toast.error("Insira pelo menos uma keyword");
      return;
    }
    if (keywords.length > 50) {
      toast.error("Máximo de 50 keywords por vez");
      return;
    }
    enqueue(keywords, {
      blogId: blog.id,
      language,
      size,
      tone,
      includeFaq,
      includeImages,
    });
  };

  const keywords = parseKeywords(keywordsText);

  return (
    <div className="p-space-6">
      <div className="flex items-center gap-space-4 mb-space-7">
        <button
          onClick={() => navigate("/client/articles")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-h1 text-foreground">Geração em Massa</h1>
      </div>

      <div className="max-w-content-list mx-auto">
        {/* ── Input Form ──────────────────────────────────────────────── */}
        {!hasStarted && (
          <div className="bg-card border border-border rounded-lg shadow-md p-space-7">
            <div className="mb-space-5">
              <div className="flex items-center justify-between mb-space-2">
                <label className="text-body-sm font-medium text-foreground">
                  Keywords (uma por linha)
                </label>
                <div className="flex gap-space-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleCSVUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-space-2"
                  >
                    <Upload className="h-4 w-4" /> Importar CSV
                  </Button>
                </div>
              </div>
              <Textarea
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                placeholder={"marketing digital para iniciantes\nSEO para e-commerce\ncomo vender mais online\nautomação de marketing"}
                rows={8}
                className="font-mono text-body-sm"
              />
              <div className="flex items-center justify-between mt-space-2">
                <p className="text-caption text-muted-foreground italic">
                  ✨ Cada keyword gera um artigo completo com análise SERP, seções paralelas e FAQ.
                </p>
                <span className="text-caption text-muted-foreground">
                  {keywords.length} keyword{keywords.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Options */}
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-space-2 text-body-sm text-muted-foreground mb-space-5 hover:text-foreground"
            >
              Opções avançadas{" "}
              {showOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showOptions && (
              <div className="grid grid-cols-2 gap-space-5 mb-space-6">
                <div>
                  <label className="text-caption text-muted-foreground mb-space-1 block">Idioma</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-br">Português (BR)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-caption text-muted-foreground mb-space-1 block">Tamanho</label>
                  <Select value={size} onValueChange={(v) => setSize(v as typeof size)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Curto (~1.000 palavras)</SelectItem>
                      <SelectItem value="medium">Médio (~2.000 palavras)</SelectItem>
                      <SelectItem value="long">Longo (~3.200 palavras)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-caption text-muted-foreground mb-space-1 block">Tom de voz</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profissional e próximo">Profissional</SelectItem>
                      <SelectItem value="casual e descontraído">Casual</SelectItem>
                      <SelectItem value="técnico e especializado">Técnico</SelectItem>
                      <SelectItem value="persuasivo e comercial">Persuasivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-space-4">
                  <div className="flex items-center justify-between">
                    <label className="text-caption text-muted-foreground">Incluir imagens</label>
                    <Switch checked={includeImages} onCheckedChange={setIncludeImages} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-caption text-muted-foreground">Incluir FAQ</label>
                    <Switch checked={includeFaq} onCheckedChange={setIncludeFaq} />
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={startGeneration}
              disabled={keywords.length === 0 || !blog}
              className="w-full h-[52px] text-body-lg"
            >
              <Sparkles className="h-5 w-5 mr-space-2" />
              Gerar {keywords.length} Artigo{keywords.length !== 1 ? "s" : ""} com IA
            </Button>
          </div>
        )}

        {/* ── Progress / Results ──────────────────────────────────────── */}
        {hasStarted && (
          <div className="space-y-space-5">
            {/* Header with stats */}
            <div className="bg-card border border-border rounded-lg p-space-5">
              <div className="flex items-center justify-between mb-space-4">
                <h2 className="text-h3 text-foreground">
                  {isRunning ? "Gerando artigos..." : allDone ? "Geração concluída!" : "Geração em massa"}
                </h2>
                <div className="flex gap-space-2">
                  {isRunning && (
                    <Button variant="destructive" size="sm" onClick={abort} className="gap-space-2">
                      <StopCircle className="h-4 w-4" /> Parar
                    </Button>
                  )}
                  {!isRunning && stats.error > 0 && blog && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryFailed({
                        blogId: blog.id, language, size, tone, includeFaq, includeImages,
                      })}
                      className="gap-space-2"
                    >
                      <RotateCcw className="h-4 w-4" /> Retry Falhas ({stats.error})
                    </Button>
                  )}
                  {!isRunning && (
                    <Button variant="outline" size="sm" onClick={reset} className="gap-space-2">
                      <Trash2 className="h-4 w-4" /> Nova Geração
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-space-3">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${stats.total > 0 ? ((stats.done / stats.total) * 100) : 0}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex gap-space-6 text-caption text-muted-foreground">
                <span>Total: <strong className="text-foreground">{stats.total}</strong></span>
                <span className="text-green-500">✓ {stats.done}</span>
                {stats.running > 0 && <span className="text-primary">⟳ {stats.running}</span>}
                {stats.pending > 0 && <span>⏳ {stats.pending}</span>}
                {stats.error > 0 && <span className="text-destructive">✗ {stats.error}</span>}
              </div>
            </div>

            {/* Items list */}
            <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-space-4 px-space-5 py-space-4 transition-colors ${
                    item.status === "running" ? "bg-primary/5" : ""
                  }`}
                >
                  <span className="text-caption text-muted-foreground w-6 text-right shrink-0">
                    {index + 1}.
                  </span>
                  <StatusIcon status={item.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-foreground truncate">
                      {item.keyword}
                    </p>
                    {item.status === "running" && item.currentStep && (
                      <p className="text-caption text-muted-foreground mt-0.5">
                        {item.currentStep}
                      </p>
                    )}
                    {item.status === "error" && item.error && (
                      <p className="text-caption text-destructive mt-0.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {item.error}
                      </p>
                    )}
                  </div>
                  {/* Progress for running items */}
                  {item.status === "running" && (
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {/* Link to article for done items */}
                  {item.status === "done" && item.articleId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/client/articles/${item.articleId}`)}
                      className="shrink-0 gap-1 text-caption"
                    >
                      <FileText className="h-3.5 w-3.5" /> Editar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
