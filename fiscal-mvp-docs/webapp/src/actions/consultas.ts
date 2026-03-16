"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function getAllConsultas() {
  const user = await currentUser();
  if (!user) throw new Error("Usuário não autenticado");

  const supabase = getSupabaseAdmin();

  const { data: contador } = await supabase
    .from("contadores")
    .select("id")
    .eq("clerk_user_id", user.id)
    .single();

  if (!contador) return [];

  const { data: consultas } = await supabase
    .from("consultas")
    .select("*, empresa:empresas!inner(razao_social, cnpj, contador_id)")
    .eq("empresa.contador_id", contador.id)
    .order("created_at", { ascending: false });

  return (consultas || []).map(c => ({
    id: c.id,
    created_at: c.created_at,
    status: c.status,
    empresa: c.empresa.razao_social,
    cnpj: c.empresa.cnpj,
    pendencias: c.pendencias,
    diagnostico: c.diagnostico,
    pdf_url: c.pdf_url,
  }));
}
