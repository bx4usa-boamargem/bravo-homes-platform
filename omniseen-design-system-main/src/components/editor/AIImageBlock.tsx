// src/components/editor/AIImageBlock.tsx
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Componente visual do nó de imagem ────────────────────────────────────────
function AIImageNodeView({ node, updateAttributes }: any) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(node.attrs.prompt ?? "");
  const [selectedStyle, setSelectedStyle] = useState(node.attrs.style ?? "photorealistic");

  const regenerate = async (prompt?: string, style?: string) => {
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-regen-image", {
        body: {
          prompt: prompt ?? node.attrs.prompt,
          style: style ?? node.attrs.style,
          context: node.attrs.context ?? "",
        },
      });
      if (error) throw error;
      updateAttributes({
        src: data.image_url,
        prompt: prompt ?? node.attrs.prompt,
        style: style ?? node.attrs.style,
      });
      toast.success("Imagem regenerada com sucesso!");
    } catch (err) {
      toast.error("Erro ao regenerar imagem");
      console.error(err);
    } finally {
      setIsRegenerating(false);
      setIsModalOpen(false);
    }
  };

  return (
    <NodeViewWrapper className="relative group my-4">
      <img
        src={node.attrs.src}
        alt={node.attrs.caption ?? ""}
        className="w-full rounded-lg object-cover max-h-96"
      />
      {node.attrs.caption && (
        <p className="text-sm text-gray-500 text-center mt-1 italic">{node.attrs.caption}</p>
      )}

      {/* Overlay de ações — aparece no hover */}
      <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => regenerate()}
          disabled={isRegenerating}
          className="gap-2"
        >
          {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Regenerar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsModalOpen(true)}
          className="gap-2"
        >
          <Pencil className="w-4 h-4" />
          Editar Prompt
        </Button>
      </div>

      {/* Modal de edição de prompt */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Prompt da Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Descreva a imagem que você quer gerar..."
              rows={3}
            />
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Estilo visual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photorealistic">Fotorrealista</SelectItem>
                <SelectItem value="illustration">Ilustração</SelectItem>
                <SelectItem value="vector">Vetor / Minimalista</SelectItem>
                <SelectItem value="minimal">Clean / Minimalista</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => regenerate(customPrompt, selectedStyle)}
              disabled={isRegenerating || !customPrompt}
              className="w-full gap-2"
            >
              {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Gerar Nova Imagem
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  );
}

// ─── Extensão TipTap ──────────────────────────────────────────────────────────
export const AIImageBlock = Node.create({
  name: "aiImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      prompt: { default: "" },
      style: { default: "photorealistic" },
      caption: { default: "" },
      context: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="ai-image"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-type": "ai-image", ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIImageNodeView);
  },
});
