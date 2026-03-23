import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, PenTool, ChevronDown, ChevronUp, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBlog } from "@/hooks/useBlog";
import { toast } from "sonner";
import {
  useArticlePipeline,
  PIPELINE_STEP_LABELS,
  PIPELINE_STEP_INDEX,
} from "@/hooks/useArticlePipeline";
import OutlineEditor, { type OutlineSection } from "@/components/editor/OutlineEditor";
import NlpKeywordsSuggestions from "@/components/editor/NlpKeywordsSuggestions";

export default function ArticleGenerator() {
  const navigate = useNavigate();
  const { blog } = useBlog();
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [keyword, setKeyword] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const [language, setLanguage] = useState("pt-br");
  const [size, setSize] = useState<"short" | "medium" | "long">("medium");
  const [tone, setTone] = useState("profissional e próximo");
  const [includeImages, setIncludeImages] = useState(true);
  const [includeFaq, setIncludeFaq] = useState(true);
  const [useOutlineEditor, setUseOutlineEditor] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [outlineSections, setOutlineSections] = useState<OutlineSection[]>([]);
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [pov, setPov] = useState("third");
  const [brandVoice, setBrandVoice] = useState("");
  const [includeYouTube, setIncludeYouTube] = useState(false);

  // ── Pipeline hook: Realtime progress from Supabase ────────────────────────
  const onComplete = useCallback(
    (articleId: string) => {
      toast.success("Artigo gerado com sucesso!");
      // Pequeno delay para o usuário ver o estado "done" antes de redirecionar
      setTimeout(() => navigate(`/client/articles/${articleId}`), 800);
    },
    [navigate],
  );

  const { state: pipeline, trigger, reset } = useArticlePipeline(onComplete);

  const isGenerating = !["idle", "done", "error"].includes(pipeline.status);
  const isDone = pipeline.status === "done";
  const hasError = pipeline.status === "error";

  // Índice do step atual para a lista visual
  const currentStepIndex = PIPELINE_STEP_INDEX[pipeline.status] ?? -1;

  // ── Iniciar geração ───────────────────────────────────────────────────────
  const startGeneration = async (customOutline?: string[]) => {
    if (!keyword.trim() || !blog) return;
    
    // If outline editor is enabled and we haven't shown it yet, show it first
    if (useOutlineEditor && !showOutline && !customOutline) {
      setShowOutline(true);
      return;
    }
    
    await trigger({
      blogId: blog.id,
      keyword,
      language,
      size,
      tone,
      includeFaq,
      includeImages,
      customOutline,
    });
  };

  // ── Modo manual ───────────────────────────────────────────────────────────
  if (mode === "manual") {
    navigate("/client/articles/new-manual");
    return null;
  }

  return (
    <div className="p-space-6">
      <div className="flex items-center gap-space-4 mb-space-7">
        <button
          onClick={() => navigate("/client/articles")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-h1 text-foreground">Novo Artigo</h1>
      </div>

      <div className="max-w-content-generator mx-auto bg-card border border-border rounded-lg shadow-md p-space-7">

        {/* ── Formulário ─────────────────────────────────────────────────── */}
        {!isGenerating && !isDone && !hasError && (
          <>
            <div className="grid grid-cols-2 gap-space-4 mb-space-7">
              <button
                onClick={() => setMode("ai")}
                className={`h-14 rounded-md flex items-center justify-center gap-space-3 text-body font-medium transition-all ${
                  mode === "ai"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground hover:bg-accent"
                }`}
              >
                <Sparkles className="h-5 w-5" /> Gerar com IA
              </button>
              <button
                onClick={() => setMode("manual")}
                className="h-14 rounded-md flex items-center justify-center gap-space-3 text-body font-medium border border-border text-foreground hover:bg-accent"
              >
                <PenTool className="h-5 w-5" /> Escrever Manual
              </button>
            </div>

            <div className="mb-space-5">
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">
                Palavra-chave principal
              </label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startGeneration()}
                placeholder="Ex: marketing digital para pequenas empresas"
                className="h-12"
              />
              <p className="text-caption text-muted-foreground mt-space-2 italic">
                ✨ Analisa os 10 primeiros do Google, escreve seções em paralelo e injeta perguntas reais do PAA. Artigos 2x mais longos que os concorrentes.
              </p>
              {blog && (
                <NlpKeywordsSuggestions
                  keyword={keyword}
                  blogId={blog.id}
                  selectedKeywords={secondaryKeywords}
                  onAddKeyword={(kw) => setSecondaryKeywords((prev) => [...prev, kw])}
                  onRemoveKeyword={(kw) => setSecondaryKeywords((prev) => prev.filter((k) => k !== kw))}
                />
              )}
            </div>

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
                      <SelectItem value="didático e educacional">Didático</SelectItem>
                      <SelectItem value="empático e acolhedor">Empático</SelectItem>
                      <SelectItem value="formal e acadêmico">Acadêmico</SelectItem>
                      <SelectItem value="humorístico e leve">Humorístico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-caption text-muted-foreground mb-space-1 block">Ponto de Vista (POV)</label>
                  <Select value={pov} onValueChange={setPov}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_singular">1ª pessoa singular ("Eu")</SelectItem>
                      <SelectItem value="first_plural">1ª pessoa plural ("Nós")</SelectItem>
                      <SelectItem value="second">2ª pessoa ("Você")</SelectItem>
                      <SelectItem value="third">3ª pessoa (Impessoal)</SelectItem>
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
                  <div className="flex items-center justify-between">
                    <label className="text-caption text-muted-foreground">Outline Editor</label>
                    <Switch checked={useOutlineEditor} onCheckedChange={setUseOutlineEditor} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-caption text-muted-foreground">Embed YouTube</label>
                    <Switch checked={includeYouTube} onCheckedChange={setIncludeYouTube} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-caption text-muted-foreground mb-space-1 block">Brand Voice (opcional)</label>
                  <Input
                    value={brandVoice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrandVoice(e.target.value)}
                    placeholder="Ex: Tom informal da XYZ Corp, sempre usar 'a gente' ao invés de 'nós'"
                    className="text-body-sm"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={() => startGeneration()}
              disabled={!keyword.trim() || !blog}
              className="w-full h-[52px] text-body-lg"
            >
              <Sparkles className="h-5 w-5 mr-space-2" />
              {useOutlineEditor ? "Criar Outline" : "Gerar Artigo com IA"}
            </Button>
          </>
        )}

        {/* ── Outline Editor Step ─────────────────────────────────────── */}
        {showOutline && !isGenerating && !isDone && !hasError && (
          <OutlineEditor
            sections={outlineSections}
            onChange={setOutlineSections}
            keyword={keyword}
            onConfirm={(sections) => {
              const titles = sections.map((s) => s.title);
              setShowOutline(false);
              startGeneration(titles);
            }}
            onCancel={() => setShowOutline(false)}
          />
        )}

        {/* ── Progresso do Pipeline (Realtime) ──────────────────────────── */}
        {(isGenerating || isDone) && (
          <div>
            <h3 className="text-h3 text-foreground mb-space-2 text-center">
              {isDone ? "Artigo gerado com sucesso!" : "Gerando artigo..."}
            </h3>

            {/* Step atual vindo direto do banco */}
            {pipeline.currentStep && !isDone && (
              <p className="text-body-sm text-muted-foreground text-center mb-space-5">
                {pipeline.currentStep}
              </p>
            )}

            {/* Barra de progresso real (vem do article_jobs.progress) */}
            <div className="w-full h-2 bg-muted rounded-full mb-space-6 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${isDone ? 100 : pipeline.progress}%` }}
              />
            </div>

            {/* Lista de steps */}
            <div className="space-y-space-3 mb-space-7">
              {PIPELINE_STEP_LABELS.map((label, i) => {
                const isActive = i === currentStepIndex && !isDone;
                const isCompleted = i < currentStepIndex || isDone;

                return (
                  <div key={i} className="flex items-center gap-space-3">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3" />
                      ) : isActive ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span className="text-tiny">{i + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-body ${
                        isCompleted || isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Ações pós-geração */}
            {isDone && pipeline.articleId && (
              <div className="flex gap-space-4">
                <Button
                  onClick={() => navigate(`/client/articles/${pipeline.articleId}`)}
                  className="flex-1"
                >
                  Editar Artigo
                </Button>
                <Button variant="secondary" className="flex-1 border border-border">
                  Publicar Agora
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Estado de Erro ─────────────────────────────────────────────── */}
        {hasError && (
          <div className="text-center">
            <div className="flex justify-center mb-space-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h3 className="text-h3 text-foreground mb-space-3">Erro na geração</h3>
            <p className="text-body-sm text-muted-foreground mb-space-6">
              {pipeline.error ?? "Ocorreu um erro inesperado durante a geração."}
            </p>
            <div className="flex gap-space-4">
              <Button onClick={reset} className="flex-1">
                Tentar Novamente
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/client/articles")}
                className="flex-1 border border-border"
              >
                Voltar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
