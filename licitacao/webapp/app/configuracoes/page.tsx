"use client";

import { useState } from "react";
import { User, Shield, CreditCard, BellOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConfiguracoesPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-medium text-text-primary">
          Configurações
        </h2>
        <p className="text-text-secondary">
          Gerencie sua conta e preferências.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden divide-y divide-border">
        {/* Seção 1: Perfil */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User size={18} className="text-emerald" />
            <h3 className="font-medium text-text-primary">Dados da Empresa</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Razão Social</label>
              <input 
                type="text" 
                defaultValue="Empresa Exemplo LTDA"
                className="w-full bg-white border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald transition-all"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CNPJ</label>
              <input 
                type="text" 
                defaultValue="12.345.678/0001-90"
                className="w-full bg-white border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald transition-all"
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Plano */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-emerald" />
            <div>
              <h3 className="font-medium text-text-primary">Meu Plano</h3>
              <p className="text-xs text-text-secondary">Assinatura mensal ativa desde Jan/2026</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-emerald/10 text-emerald px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Plano Básico
            </span>
            <button className="text-sm font-medium text-emerald hover:underline">
              Upgrade de Plano
            </button>
          </div>
        </div>

        {/* Seção 3: Notificações */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellOff size={18} className="text-slate-400" />
            <div>
              <h3 className="font-medium text-text-primary">Pausar Alertas</h3>
              <p className="text-xs text-text-secondary">Pare de receber mensagens temporariamente no WhatsApp.</p>
            </div>
          </div>
          <button 
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors duration-200 outline-none cursor-pointer hover:ring-2 hover:ring-emerald/20",
              notificationsEnabled ? "bg-emerald" : "bg-slate-200"
            )}
            title={notificationsEnabled ? "Pausar Alertas" : "Ativar Alertas"}
          >
            <div className={cn(
              "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200",
              notificationsEnabled && "translate-x-5"
            )} />
          </button>
        </div>

        {/* Seção 4: Segurança */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-slate-400" />
            <h3 className="font-medium text-text-primary">Segurança</h3>
          </div>
          <button className="text-sm text-red-500 font-medium hover:underline flex items-center gap-2">
            <Trash2 size={16} />
            Excluir minha conta permanentemente
          </button>
        </div>
      </div>
    </div>
  );
}
