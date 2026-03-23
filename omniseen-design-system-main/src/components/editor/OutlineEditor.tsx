import { useState } from "react";
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface OutlineSection {
  id: string;
  title: string;
}

interface OutlineEditorProps {
  sections: OutlineSection[];
  onChange: (sections: OutlineSection[]) => void;
  onConfirm: (sections: OutlineSection[]) => void;
  onCancel: () => void;
  keyword: string;
}

export default function OutlineEditor({
  sections,
  onChange,
  onConfirm,
  onCancel,
  keyword,
}: OutlineEditorProps) {
  const addSection = () => {
    onChange([
      ...sections,
      { id: `s-${Date.now()}`, title: "" },
    ]);
  };

  const removeSection = (id: string) => {
    onChange(sections.filter((s) => s.id !== id));
  };

  const updateTitle = (id: string, title: string) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, title } : s)));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    onChange(newSections);
  };

  const generateDefaultOutline = () => {
    const defaults: OutlineSection[] = [
      { id: `s-${Date.now()}-1`, title: `O que é ${keyword}?` },
      { id: `s-${Date.now()}-2`, title: `Por que ${keyword} é importante?` },
      { id: `s-${Date.now()}-3`, title: `Como implementar ${keyword}` },
      { id: `s-${Date.now()}-4`, title: `Benefícios de ${keyword}` },
      { id: `s-${Date.now()}-5`, title: `Erros comuns ao usar ${keyword}` },
      { id: `s-${Date.now()}-6`, title: `Dicas práticas para ${keyword}` },
      { id: `s-${Date.now()}-7`, title: `Conclusão` },
    ];
    onChange(defaults);
  };

  return (
    <div className="space-y-space-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-h3 text-foreground">Estrutura do Artigo</h3>
          <p className="text-caption text-muted-foreground mt-1">
            Customize os subtítulos (H2) antes de gerar. Reordene, adicione ou remova seções.
          </p>
        </div>
        {sections.length === 0 && (
          <Button variant="outline" size="sm" onClick={generateDefaultOutline} className="gap-2">
            <Sparkles className="h-4 w-4" /> Gerar Outline
          </Button>
        )}
      </div>

      {/* Sections list */}
      {sections.length > 0 && (
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="flex items-center gap-2 group bg-muted/30 rounded-lg px-3 py-2 border border-border hover:border-primary/20 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
              <span className="text-caption text-muted-foreground font-mono w-8 shrink-0">
                H2.{index + 1}
              </span>
              <Input
                value={section.title}
                onChange={(e) => updateTitle(section.id, e.target.value)}
                placeholder={`Subtítulo ${index + 1}...`}
                className="flex-1 border-none bg-transparent h-9 px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveSection(index, "up")}
                  disabled={index === 0}
                  className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveSection(index, "down")}
                  disabled={index === sections.length - 1}
                  className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => removeSection(section.id)}
                  className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add section button */}
      {sections.length > 0 && (
        <button
          onClick={addSection}
          className="w-full h-10 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-body-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <Plus className="h-4 w-4" /> Adicionar Seção
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-space-3 pt-space-3">
        <Button
          onClick={() => onConfirm(sections)}
          disabled={sections.length === 0 || sections.some((s) => !s.title.trim())}
          className="flex-1 h-[52px] text-body-lg"
        >
          <Sparkles className="h-5 w-5 mr-space-2" />
          Gerar com este Outline
        </Button>
        <Button variant="outline" onClick={onCancel} className="h-[52px]">
          Voltar
        </Button>
      </div>
    </div>
  );
}
