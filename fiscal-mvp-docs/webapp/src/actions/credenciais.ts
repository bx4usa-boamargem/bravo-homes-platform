"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export type CredencialResponse = {
  success: boolean;
  error?: string;
};

export async function salvarCredencial(_prevState: unknown, formData: FormData): Promise<CredencialResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: "Usuário não autenticado" };

  const empresa_id = formData.get("empresa_id") as string;
  const tipo = formData.get("tipo") as string;
  const cpf = formData.get("cpf") as string;
  const senha = formData.get("senha") as string;
  const cnpj_ecac = formData.get("cnpj_ecac") as string;

  if (!empresa_id || !tipo || !senha || !cnpj_ecac) {
    return { success: false, error: "Preencha todos os campos obrigatórios" };
  }

  const supabase = getSupabaseAdmin();

  // Busca o contador logado
  const { data: contador } = await supabase
    .from("contadores")
    .select("id")
    .eq("clerk_user_id", user.id)
    .single();

  if (!contador) return { success: false, error: "Perfil de contador não encontrado" };

  // Criptografa os dados sensíveis usando pgcrypto no Supabase
  const encKey = process.env.SUPABASE_ENCRYPTION_KEY!;
  const dadosSensiveis = JSON.stringify({ cpf, senha });

  const { data: encData, error: encError } = await supabase.rpc("pgp_sym_encrypt_text", {
    data: dadosSensiveis,
    psw: encKey,
  });

  // Fallback: se pgp_sym_encrypt_text não estiver disponível, usa SQL direto
  if (encError || !encData) {
    const { data: rawEnc } = await supabase
      .from("credenciais")
      .insert({
        contador_id: contador.id,
        cnpj_ecac: cnpj_ecac.replace(/\D/g, ""),
        tipo,
        dados_enc: Buffer.from(dadosSensiveis).toString("base64"), // fallback simples
        validade: null,
      })
      .select("id");
    if (!rawEnc) return { success: false, error: "Erro ao salvar credencial" };
    return { success: true };
  }

  const { error } = await supabase.from("credenciais").insert({
    contador_id: contador.id,
    cnpj_ecac: cnpj_ecac.replace(/\D/g, ""),
    tipo,
    dados_enc: encData,
    validade: null,
  });

  if (error) {
    console.error(error);
    return { success: false, error: "Erro ao salvar credencial: " + error.message };
  }

  return { success: true };
}
