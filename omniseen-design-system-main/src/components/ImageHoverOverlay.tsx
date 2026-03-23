import { useState } from "react";
import { RefreshCw, Pencil, Loader2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const IMAGE_STYLES = [
  { value: "photorealistic", label: "📷 Fotográfico" },
  { value: "illustration", label: "🎨 Ilustração" },
  { value: "minimal", label: "✨ Minimalista" },
  { value: "vector", label: "🔷 Vetorial" },
];

interface ImageHoverOverlayProps {
  src: string;
  alt?: string;
  onImageUpdate: (newSrc: string) => void;
}

export default function ImageHoverOverlay({ src, alt, onImageUpdate }: ImageHoverOverlayProps) {
  const [hovered, setHovered] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editPrompt, setEditPrompt] = useState(alt || "");
  const [showEdit, setShowEdit] = useState(false);
  const [style, setStyle] = useState("photorealistic");

  const regenerate = async (prompt: string, selectedStyle: string) => {
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-regen-image", {
        body: { prompt, style: selectedStyle },
      });
      if (error || !data?.image_url) {
        toast.error("Erro ao regenerar imagem");
        return;
      }
      onImageUpdate(data.image_url);
      toast.success("Imagem regenerada!");
    } catch {
      toast.error("Erro ao regenerar imagem");
    } finally {
      setRegenerating(false);
      setShowEdit(false);
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowEdit(false); }}
    >
      <img src={src} alt={alt} className="max-w-full rounded" />
      {(hovered || showEdit) && (
        <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center gap-2 transition-opacity">
          {regenerating ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 text-foreground hover:bg-white"
                onClick={() => regenerate(alt || "image", style)}
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Regenerar
              </Button>
              <Popover open={showEdit} onOpenChange={setShowEdit}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/90 text-foreground hover:bg-white"
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Editar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-3">
                    <label className="text-body-sm font-medium text-foreground">Prompt da imagem</label>
                    <Input
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="Descreva a imagem desejada"
                    />
                    <div>
                      <label className="text-body-sm font-medium text-foreground mb-1 block">Estilo</label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IMAGE_STYLES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" className="w-full" onClick={() => regenerate(editPrompt, style)} disabled={!editPrompt.trim()}>
                      Regenerar com novo prompt
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      )}
    </div>
  );
}
