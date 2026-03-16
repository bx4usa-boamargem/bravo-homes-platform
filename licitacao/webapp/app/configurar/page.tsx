"use client";

import { useState } from "react";
import { Plus, X, Search, Save, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagFieldProps {
  label: string;
  description: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
}

function TagField({ label, description, tags, onAdd, onRemove, placeholder }: TagFieldProps) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input.trim());
      setInput("");
    }
  };

  return (
    <div className="p-6 border-b border-border last:border-b-0">
      <h4 className="font-medium text-text-primary mb-1">{label}</h4>
      <p className="text-xs text-text-secondary mb-4">{description}</p>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
          <span 
            key={tag} 
            className="inline-flex items-center bg-slate-100 text-text-primary px-3 py-1 rounded-full text-sm group"
          >
            {tag}
            <button 
              onClick={() => onRemove(tag)}
              className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2 max-w-md">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder || "+ Adicionar..."}
          className="flex-1 bg-white border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald"
        />
        <button 
          onClick={handleAdd}
          className="bg-slate-100 text-slate-600 p-2 rounded-md hover:bg-slate-200 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

export default function ConfigurarPage() {
  const [keywords, setKeywords] = useState(["seringa", "luva", "material médico"]);
  const [cnaes, setCnaes] = useState(["47.72-5"]);
  const [estados, setEstados] = useState(["SP", "RJ"]);
  const [valorMin, setValorMin] = useState(0);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-medium text-text-primary">
          Configurar Alertas
        </h2>
        <p className="text-text-secondary">
          Defina o que você quer monitorar. Salvamos automaticamente.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <TagField 
          label="Palavras-chave"
          description="Dica: use termos que aparecem no objeto das licitações (ex: material hospitalar)."
          tags={keywords}
          onAdd={(tag) => !keywords.includes(tag) && setKeywords([...keywords, tag])}
          onRemove={(tag) => setKeywords(keywords.filter(t => t !== tag))}
          placeholder="Ex: luva, seringa, manutenção..."
        />

        <TagField 
          label="CNAE (Atividade Econômica)"
          description="Dica: use seu CNAE principal ou secundário para filtrar por segmento."
          tags={cnaes}
          onAdd={(tag) => !cnaes.includes(tag) && setCnaes([...cnaes, tag])}
          onRemove={(tag) => setCnaes(cnaes.filter(t => t !== tag))}
          placeholder="Ex: 4772, 8610..."
        />

        <TagField 
          label="Estados (UF)"
          description="Deixe vazio para receber alertas de todo o Brasil."
          tags={estados}
          onAdd={(tag) => tag.length === 2 && !estados.includes(tag.toUpperCase()) && setEstados([...estados, tag.toUpperCase()])}
          onRemove={(tag) => setEstados(estados.filter(t => t !== tag))}
          placeholder="Ex: SP, RJ, MG"
        />

        <div className="p-6">
          <h4 className="font-medium text-text-primary mb-1">Valor mínimo da licitação</h4>
          <p className="text-xs text-text-secondary mb-4">Apenas licitações acima deste valor serão enviadas. Use 0 para todas.</p>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm italic">R$</span>
            <input 
              type="number" 
              value={valorMin}
              onChange={(e) => setValorMin(Number(e.target.value))}
              className="w-full bg-white border border-border rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald tabular-nums"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="flex items-center gap-2 bg-emerald text-white px-6 py-2.5 rounded-md font-medium hover:bg-emerald/90 transition-colors shadow-sm">
          <Save size={18} />
          Salvar Configurações
        </button>
        <button className="flex items-center gap-2 bg-white border border-border text-text-primary px-6 py-2.5 rounded-md font-medium hover:bg-slate-50 transition-colors">
          <Play size={18} className="text-emerald" />
          Testar Filtros Agora
        </button>
      </div>
    </div>
  );
}
