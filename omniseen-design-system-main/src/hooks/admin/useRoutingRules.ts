import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RoutingRule {
  id: string;
  condition_field: string;
  condition_operator: string;
  condition_value: string;
  action_type: string;
  action_value: string | null;
  is_active: boolean | null;
  priority: number | null;
}

export function useRoutingRules() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase.from("routing_rules").select("*").order("priority");
    if (data) setRules(data as RoutingRule[]);
    setLoading(false);
  };

  const addRule = async (rule: Omit<RoutingRule, "id">) => {
    const { error } = await supabase.from("routing_rules").insert(rule);
    if (error) toast.error("Erro ao adicionar regra");
    else { toast.success("Regra adicionada"); fetch(); }
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase.from("routing_rules").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Regra excluída"); fetch(); }
  };

  const toggleRule = async (id: string, active: boolean) => {
    await supabase.from("routing_rules").update({ is_active: active }).eq("id", id);
    fetch();
  };

  useEffect(() => { fetch(); }, []);
  return { rules, loading, addRule, deleteRule, toggleRule, refetch: fetch };
}
