"use client";

import { useState } from "react";
import { X, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { IMaskInput } from "react-imask";
import { salvarCredencial } from "@/actions/credenciais";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  empresa: {
    id: string;
    cnpj: string;
    razao_social: string;
  };
}

export default function CredencialModal({ isOpen, onClose, empresa }: Props) {
  const [tipo, setTipo] = useState<"login_senha" | "certificado_a1">("login_senha");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pfxFileName, setPfxFileName] = useState<string>("");
  const [pfxBase64, setPfxBase64] = useState<string>("");

  if (!isOpen) return null;

  const formatCnpj = (cnpj: string) =>
    cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.append("empresa_id", empresa.id);
    formData.append("tipo", tipo);
    formData.append("cnpj_ecac", empresa.cnpj);
    if (tipo === "certificado_a1" && pfxBase64) {
      formData.append("pfx_base64", pfxBase64);
    }

    try {
      const res = await salvarCredencial(null, formData);
      if (!res.success) {
        setError(res.error || "Erro desconhecido");
      } else {
        setSuccess(true);
        setTimeout(() => { onClose(); setSuccess(false); }, 1500);
      }
    } catch {
      setError("Erro de conexão ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Configurar Credencial</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {empresa.razao_social} — {formatCnpj(empresa.cnpj)}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form action={handleSubmit} className="p-6 space-y-5">
          {/* Sucesso */}
          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 flex items-center gap-2">
              <ShieldCheck size={16} /> Credencial salva com criptografia!
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          {/* Seleção de tipo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Tipo de Acesso ao e-CAC</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "login_senha", label: "Login/Senha", sub: "CPF + senha gov.br", icon: KeyRound },
                { value: "certificado_a1", label: "Certificado A1", sub: "Arquivo .pfx", icon: ShieldCheck },
              ].map(({ value, label, sub, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTipo(value as "login_senha" | "certificado_a1")}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    tipo === value
                      ? "border-action bg-blue-50 text-action"
                      : "border-border text-text-secondary hover:border-slate-300"
                  }`}
                >
                  <Icon size={18} className="mb-1" />
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs opacity-70">{sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Campos Login/Senha */}
          {tipo === "login_senha" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="cpf" className="text-sm font-medium text-text-secondary">
                  CPF do responsável
                </label>
                <IMaskInput
                  mask="000.000.000-00"
                  name="cpf"
                  id="cpf"
                  placeholder="000.000.000-00"
                  className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-action"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="senha" className="text-sm font-medium text-text-secondary">
                  Senha do Gov.br
                </label>
                <input
                  type="password"
                  name="senha"
                  id="senha"
                  placeholder="••••••••"
                  className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-action"
                  required
                />
                <p className="text-xs text-text-secondary">
                  🔒 Criptografada com AES-256 antes de ser armazenada.
                </p>
              </div>
            </div>
          )}

          {/* Campos Certificado A1 */}
          {tipo === "certificado_a1" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Arquivo do Certificado (.pfx)
                </label>
                <label
                  htmlFor="pfx_file"
                  className={`flex items-center gap-3 w-full h-12 px-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors
                    ${pfxFileName ? "border-action bg-blue-50 text-action" : "border-border text-text-secondary hover:border-slate-400"}`}
                >
                  <ShieldCheck size={18} className="shrink-0" />
                  <span className="text-sm truncate">
                    {pfxFileName || "Clique para selecionar o arquivo .pfx"}
                  </span>
                </label>
                <input
                  id="pfx_file"
                  type="file"
                  accept=".pfx,.p12"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPfxFileName(file.name);
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const b64 = (ev.target?.result as string).split(",")[1];
                      setPfxBase64(b64);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="senha" className="text-sm font-medium text-text-secondary">
                  Senha do Certificado
                </label>
                <input
                  type="password"
                  name="senha"
                  id="senha"
                  placeholder="Senha do arquivo .pfx"
                  className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-action"
                  required
                />
                <p className="text-xs text-text-secondary">
                  🔒 O arquivo e a senha são criptografados antes de serem armazenados.
                </p>
              </div>
            </div>
          )}


          {/* Aviso LGPD */}
          <div className="p-3 bg-slate-50 rounded-lg text-xs text-text-secondary border border-border">
            🛡️ <strong>Segurança LGPD:</strong> As credenciais são criptografadas via <code>pgcrypto</code> e jamais
            são exibidas em texto claro após o cadastro.
          </div>

          <div className="pt-2 flex justify-end gap-3">
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
              disabled={loading || success}
              className="bg-action hover:bg-action-hover text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-70"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Salvando..." : "Salvar Credencial"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
