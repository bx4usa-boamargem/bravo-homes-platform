import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean | null;
  accepted_at: string | null;
  last_login_at: string | null;
  created_at: string | null;
}

export function useAdminTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase.from("admin_team_members").select("*").order("created_at");
    if (data) setMembers(data as TeamMember[]);
    setLoading(false);
  };

  const invite = async (name: string, email: string, role: string) => {
    const token = crypto.randomUUID();
    const { error } = await supabase.from("admin_team_members").insert({
      name, email, role,
      invite_token: token,
      invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (error) toast.error("Erro ao convidar: " + error.message);
    else { toast.success(`Convite enviado para ${email}`); fetch(); }
  };

  const remove = async (id: string) => {
    await supabase.from("admin_team_members").delete().eq("id", id);
    toast.success("Membro removido");
    fetch();
  };

  const updateRole = async (id: string, role: string) => {
    await supabase.from("admin_team_members").update({ role }).eq("id", id);
    toast.success("Role atualizado");
    fetch();
  };

  useEffect(() => { fetch(); }, []);
  return { members, loading, invite, remove, updateRole, refetch: fetch };
}
