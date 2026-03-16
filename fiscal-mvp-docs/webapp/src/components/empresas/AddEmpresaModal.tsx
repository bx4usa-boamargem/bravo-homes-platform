"use client";

import { useState } from "react";
import { IMaskInput } from "react-imask";
import { X, Loader2 } from "lucide-react";
import { addEmpresa } from "@/actions/empresas";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddEmpresaModal({ isOpen, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await addEmpresa(null, formData);
      if (!res.success) {
        setError(res.error || "Erro desconhecido");
      } else {
        onClose(); // Sucesso
      }
    } catch {
      setError("Erro de conexão ao salvar empresa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">Adicionar Empresa</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form action={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="cnpj" className="text-sm font-medium text-text-secondary">
              CNPJ
            </label>
            <IMaskInput
              mask="00.000.000/0001-00"
              name="cnpj"
              id="cnpj"
              placeholder="00.000.000/0001-00"
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-action"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="razao_social" className="text-sm font-medium text-text-secondary">
              Razão Social
            </label>
            <input
              type="text"
              name="razao_social"
              id="razao_social"
              placeholder="Ex: Empresa de Tecnologia Ltda"
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-action"
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-action hover:bg-action-hover text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-70"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Salvando..." : "Salvar Empresa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
