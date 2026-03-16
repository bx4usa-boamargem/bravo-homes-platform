"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function getDashboardStats() {
  const user = await currentUser();
  if (!user) throw new Error("Usuário não autenticado");

  const supabase = getSupabaseAdmin();

  // Get contador ID
  const { data: contador } = await supabase
    .from("contadores")
    .select("id")
    .eq("clerk_user_id", user.id)
    .single();

  if (!contador) {
    return {
      empresasCount: 0,
      pendenciasCount: 0,
      falhasCount: 0,
    };
  }

  // Count empresas
  const { count: empresasCount } = await supabase
    .from("empresas")
    .select("*", { count: 'exact', head: true })
    .eq("contador_id", contador.id);

  // Count pendências in the companies of this contador
  const { count: pendenciasCount } = await supabase
    .from("consultas")
    .select("*, empresa:empresas!inner(contador_id)", { count: 'exact', head: true })
    .eq("empresa.contador_id", contador.id)
    .eq("status", "pendente");

  // Count failures in the companies of this contador
  const { count: falhasCount } = await supabase
    .from("consultas")
    .select("*, empresa:empresas!inner(contador_id)", { count: 'exact', head: true })
    .eq("empresa.contador_id", contador.id)
    .eq("status", "falha");

  return {
    empresasCount: empresasCount || 0,
    pendenciasCount: pendenciasCount || 0,
    falhasCount: falhasCount || 0,
  };
}

export async function getPendenciasCount(): Promise<number> {
  try {
    const user = await currentUser();
    if (!user) return 0;
    const supabase = getSupabaseAdmin();
    const { data: contador } = await supabase
      .from("contadores").select("id").eq("clerk_user_id", user.id).single();
    if (!contador) return 0;
    const { count } = await supabase
      .from("consultas")
      .select("*, empresa:empresas!inner(contador_id)", { count: "exact", head: true })
      .eq("empresa.contador_id", contador.id)
      .eq("status", "pendente");
    return count || 0;
  } catch {
    return 0;
  }
}

export async function getRecentConsultas() {
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
    .order("created_at", { ascending: false })
    .limit(5);

  return (consultas || []).map(c => ({
    id: c.id,
    created_at: c.created_at,
    status: c.status,
    empresa: c.empresa.razao_social,
    cnpj: c.empresa.cnpj
  }));
}

