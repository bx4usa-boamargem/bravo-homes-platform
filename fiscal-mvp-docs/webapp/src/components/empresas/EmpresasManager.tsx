"use client";

import { useState, useMemo, useRef } from "react";
import {
  Building2, Plus, ArrowRight, Search,
  LayoutGrid, List, MoreVertical, PowerOff, Trash2, Loader2,
} from "lucide-react";
import AddEmpresaModal from "./AddEmpresaModal";
import CredencialModal from "./CredencialModal";
import { toggleEmpresaAtiva, deleteEmpresa } from "@/actions/empresas";

interface Empresa {
  id: string;
  cnpj: string;
  razao_social: string;
  ativo: boolean;
  created_at: string;
}

interface Props { initialEmpresas: Empresa[] }

const formatCnpj = (cnpj: string) =>
  cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

// Dropdown de ações por empresa — usa fixed para escapar do overflow da tabela
function EmpresaMenu({ empresa, onAction }: { empresa: Empresa; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [loading, setLoading] = useState<"toggle" | "delete" | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen(!open);
  }

  async function handleToggle() {
    setLoading("toggle");
    await toggleEmpresaAtiva(empresa.id, empresa.ativo);
    setLoading(null); setOpen(false); onAction();
  }

  async function handleDelete() {
    if (!confirm(`Deletar "${empresa.razao_social}"?\n\nEsta ação removerá também as credenciais e consultas vinculadas.`)) return;
    setLoading("delete");
    await deleteEmpresa(empresa.id);
    setLoading(null); setOpen(false); onAction();
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            style={{ top: pos.top, right: pos.right, position: "fixed" }}
            className="z-50 bg-white border border-border rounded-lg shadow-xl w-48 py-1 overflow-hidden"
          >
            <button
              onClick={handleToggle}
              disabled={!!loading}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {loading === "toggle" ? <Loader2 size={14} className="animate-spin" /> : <PowerOff size={14} />}
              {empresa.ativo ? "Inativar empresa" : "Ativar empresa"}
            </button>
            <hr className="my-1 border-border" />
            <button
              onClick={handleDelete}
              disabled={!!loading}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {loading === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Deletar empresa
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function EmpresasManager({ initialEmpresas }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [credencialEmpresa, setCredencialEmpresa] = useState<Empresa | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const empresas = initialEmpresas;

  // Refresh local ao fazer ação (ativa/inativa/delete)
  function refresh() { window.location.reload(); }

  const filtered = useMemo(() =>
    empresas.filter(e =>
      e.razao_social.toLowerCase().includes(search.toLowerCase()) ||
      e.cnpj.includes(search.replace(/\D/g, ""))
    ), [empresas, search]);

  const StatusBadge = ({ ativo }: { ativo: boolean }) => (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Empresas</h1>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie as empresas vinculadas ao seu plano para monitoramento fiscal.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-action hover:bg-action-hover text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Adicionar Empresa
        </button>
      </div>

      {/* Barra de busca + toggle de view */}
      {empresas.length > 0 && (
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-action"
            />
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden bg-white">
            <button
              onClick={() => setViewMode("card")}
              title="Visualização em cards"
              className={`px-3 py-2 transition-colors ${viewMode === "card" ? "bg-action text-white" : "text-slate-400 hover:text-slate-600"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Visualização em lista"
              className={`px-3 py-2 transition-colors ${viewMode === "list" ? "bg-action text-white" : "text-slate-400 hover:text-slate-600"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {empresas.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <Building2 size={24} />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Nenhuma empresa cadastrada</h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
            Adicione o primeiro CNPJ e certifique-se de cadastrar a credencial correspondente para o e-CAC.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="text-action font-medium text-sm">
            Adicionar agora
          </button>
        </div>
      )}

      {/* Sem resultados na busca */}
      {empresas.length > 0 && filtered.length === 0 && (
        <div className="text-center py-8 text-sm text-text-secondary">
          Nenhuma empresa encontrada para &quot;<strong>{search}</strong>&quot;.
        </div>
      )}

      {/* MODO CARD */}
      {viewMode === "card" && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(emp => (
            <div key={emp.id} className={`bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${!emp.ativo ? "opacity-60" : "border-border"}`}>
              <div>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-semibold text-text-primary leading-tight line-clamp-2" title={emp.razao_social}>
                    {emp.razao_social}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge ativo={emp.ativo} />
                    <EmpresaMenu empresa={emp} onAction={refresh} />
                  </div>
                </div>
                <p className="text-sm text-text-secondary font-mono">{formatCnpj(emp.cnpj)}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCredencialEmpresa(emp)}
                  className="text-xs font-medium text-action flex items-center gap-1 hover:underline"
                >
                  Configurar Credencial <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODO LISTA */}
      {viewMode === "list" && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Razão Social</th>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">CNPJ</th>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(emp => (
                <tr key={emp.id} className={`hover:bg-slate-50/50 transition-colors ${!emp.ativo ? "opacity-60" : ""}`}>
                  <td className="p-4 font-medium text-text-primary">{emp.razao_social}</td>
                  <td className="p-4 text-sm text-text-secondary font-mono">{formatCnpj(emp.cnpj)}</td>
                  <td className="p-4"><StatusBadge ativo={emp.ativo} /></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setCredencialEmpresa(emp)}
                        className="text-xs font-medium text-action flex items-center gap-1 hover:underline"
                      >
                        Credencial <ArrowRight size={12} />
                      </button>
                      <EmpresaMenu empresa={emp} onAction={refresh} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddEmpresaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {credencialEmpresa && (
        <CredencialModal
          isOpen={!!credencialEmpresa}
          onClose={() => setCredencialEmpresa(null)}
          empresa={credencialEmpresa}
        />
      )}
    </div>
  );
}
