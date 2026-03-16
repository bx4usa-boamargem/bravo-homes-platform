"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type ActionResponse = { success: boolean; error?: string };

async function getContadorId(userId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("contadores").select("id").eq("clerk_user_id", userId).single();
  return data?.id ?? null;
}

export async function getEmpresas() {
  const user = await currentUser();
  if (!user) throw new Error("Usuário não autenticado");
  const supabase = getSupabaseAdmin();
  const contadorId = await getContadorId(user.id);
  if (!contadorId) return [];
  const { data } = await supabase
    .from("empresas").select("*").eq("contador_id", contadorId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function addEmpresa(_prevState: unknown, formData: FormData): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: "Usuário não autenticado" };

  const cnpj = formData.get("cnpj") as string;
  const razao_social = formData.get("razao_social") as string;
  if (!cnpj || !razao_social) return { success: false, error: "Preencha todos os campos" };

  const cleanCnpj = cnpj.replace(/\D/g, "");
  if (cleanCnpj.length !== 14) return { success: false, error: "CNPJ inválido" };

  const supabase = getSupabaseAdmin();
  let contadorId = await getContadorId(user.id);

  if (!contadorId) {
    const { data: newContador, error: createError } = await supabase
      .from("contadores")
      .insert({
        clerk_user_id: user.id,
        nome: user.firstName || user.fullName || "Contador",
        email: user.emailAddresses[0]?.emailAddress || "sem-email@teste.com",
      })
      .select("id").single();

    if (createError) return { success: false, error: "Erro ao inicializar perfil: " + createError.message };
    contadorId = newContador.id;
  }

  // Validação do CNPJ na Receita Federal (ReceitaWS como primária, BrasilAPI como fallback)
  let razao_social_oficial = razao_social;
  try {
    let situacao: string | null = null;
    let nomeOficial: string | null = null;

    // 1ª tentativa: ReceitaWS
    const rwRes = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (rwRes.ok) {
      const rw = await rwRes.json();
      if (rw.status === "ERROR") {
        return { success: false, error: "CNPJ não encontrado na Receita Federal. Verifique o número digitado." };
      }
      situacao = rw.situacao?.toUpperCase();
      nomeOficial = rw.nome;
    } else if (rwRes.status === 429) {
      // Rate limit na ReceitaWS — tenta BrasilAPI como fallback
      const brRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
        cache: "no-store",
        headers: { "Accept": "application/json" },
      });
      if (brRes.status === 429) {
        // Ambas com rate limit — salva sem bloquear (fallback permissivo)
        console.warn("Rate limit em ambas as APIs, cadastrando sem validação online.");
      } else if (brRes.ok) {
        const br = await brRes.json();
        situacao = br.situacao_cadastral?.toUpperCase();
        nomeOficial = br.razao_social;
      } else {
        return { success: false, error: "CNPJ não encontrado na Receita Federal. Verifique o número digitado." };
      }
    } else {
      return { success: false, error: "CNPJ não encontrado na Receita Federal. Verifique o número digitado." };
    }

    if (situacao && situacao !== "ATIVA") {
      return {
        success: false,
        error: `CNPJ com situação "${situacao}" na Receita Federal. Apenas empresas ATIVAS podem ser cadastradas.`,
      };
    }
    if (nomeOficial) razao_social_oficial = nomeOficial;
  } catch {
    console.warn("APIs de CNPJ indisponíveis, cadastrando sem validação online.");
  }

  const { error } = await supabase.from("empresas").insert({
    contador_id: contadorId, cnpj: cleanCnpj, razao_social: razao_social_oficial,
  });

  if (error) {
    if (error.code === "23505") return { success: false, error: "Este CNPJ já está cadastrado." };
    return { success: false, error: "Falha ao gravar a empresa." };
  }

  revalidatePath("/client/empresas");
  revalidatePath("/client/dashboard");
  return { success: true };
}

export async function toggleEmpresaAtiva(empresaId: string, ativa: boolean): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: "Não autenticado" };
  const supabase = getSupabaseAdmin();
  const contadorId = await getContadorId(user.id);

  const { error } = await supabase
    .from("empresas").update({ ativo: !ativa })
    .eq("id", empresaId).eq("contador_id", contadorId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/client/empresas");
  revalidatePath("/client/dashboard");
  return { success: true };
}

export async function deleteEmpresa(empresaId: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: "Não autenticado" };
  const supabase = getSupabaseAdmin();
  const contadorId = await getContadorId(user.id);

  // ON DELETE CASCADE no schema garante remoção de consultas e credenciais vinculadas
  const { error } = await supabase
    .from("empresas").delete()
    .eq("id", empresaId).eq("contador_id", contadorId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/client/empresas");
  revalidatePath("/client/dashboard");
  return { success: true };
}
