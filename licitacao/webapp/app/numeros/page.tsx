"use client";

import { useState } from "react";
import { Smartphone, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhoneNumber {
  id: string;
  number: string;
  status: "ativo" | "pendente";
}

export default function NumerosPage() {
  const [numeros, setNumeros] = useState<PhoneNumber[]>([
    { id: "1", number: "+55 (11) 99999-9999", status: "ativo" },
    { id: "2", number: "+55 (11) 88888-8888", status: "ativo" },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState("");

  const handleAdd = () => {
    if (newNumber.trim()) {
      setNumeros([...numeros, { 
        id: Math.random().toString(36).substr(2, 9), 
        number: newNumber.trim(), 
        status: "pendente" 
      }]);
      setNewNumber("");
      setIsAdding(false);
    }
  };

  const handleUpdate = (id: string, value: string) => {
    setNumeros(numeros.map(n => n.id === id ? { ...n, number: value } : n));
    setEditingId(null);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-medium text-text-primary">
            Números de WhatsApp
          </h2>
          <p className="text-text-secondary">
            Os alertas serão enviados para estes números.
          </p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-emerald text-white px-4 py-2 rounded-md font-medium hover:bg-emerald/90 transition-colors shadow-sm text-sm"
          >
            <Plus size={18} />
            Adicionar Número
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg border border-border flex gap-4 items-center">
          <input 
            type="text" 
            autoFocus
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            placeholder="+55 (11) 90000-0000"
            className="flex-1 bg-white border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald"
          />
          <button 
            onClick={handleAdd}
            className="bg-emerald text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Confirmar
          </button>
          <button 
            onClick={() => setIsAdding(false)}
            className="text-sm font-medium text-slate-400"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <ul className="divide-y divide-border">
          {numeros.map((num) => (
            <li key={num.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                  <Smartphone size={20} />
                </div>
                {editingId === num.id ? (
                  <input 
                    type="text"
                    defaultValue={num.number}
                    autoFocus
                    onBlur={(e) => handleUpdate(num.id, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(num.id, e.currentTarget.value)}
                    className="flex-1 bg-white border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald"
                  />
                ) : (
                  <div>
                    <p className="font-medium text-text-primary">{num.number}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {num.status === "ativo" ? (
                        <>
                          <CheckCircle2 size={12} className="text-emerald" />
                          <span className="text-[10px] font-bold text-emerald uppercase tracking-wider">Ativo</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} className="text-yellow-500" />
                          <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Aguardando Teste</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setEditingId(num.id)}
                  className="text-sm font-medium text-slate-400 hover:text-text-primary transition-colors"
                >
                  Editar
                </button>
                <button 
                  onClick={() => setNumeros(numeros.filter(n => n.id !== num.id))}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {numeros.length === 0 && (
          <div className="p-12 text-center text-text-secondary">
            Nenhum número cadastrado ainda.
          </div>
        )}
      </div>

      <div className="bg-surface border border-border p-4 rounded-lg flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Limite do seu plano: <strong>{numeros.length} de 3</strong> números usados (Plano Básico)
        </p>
        <button className="text-sm font-medium text-emerald hover:underline">
          Fazer upgrade →
        </button>
      </div>
    </div>
  );
}
