import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Palette } from "lucide-react";
import { toast } from "sonner";

type BrandSettings = {
  id: string;
  brand_name: string;
  brand_voice: string;
  target_audience: string;
  brand_colors: { primary: string; secondary: string };
};

const VOICE_OPTIONS = [
  { value: "profissional", label: "Profissional" },
  { value: "amigável", label: "Amigável" },
  { value: "acadêmico", label: "Acadêmico" },
  { value: "descontraído", label: "Descontraído" },
  { value: "autoritativo", label: "Autoritativo" },
  { value: "inspiracional", label: "Inspiracional" },
];

export default function BrandSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BrandSettings>({
    id: "",
    brand_name: "",
    brand_voice: "profissional",
    target_audience: "",
    brand_colors: { primary: "#7c3aed", secondary: "#06b6d4" },
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("brand_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setSettings({
          id: data.id,
          brand_name: data.brand_name ?? "",
          brand_voice: data.brand_voice ?? "profissional",
          target_audience: data.target_audience ?? "",
          brand_colors: (data.brand_colors as any) ?? { primary: "#7c3aed", secondary: "#06b6d4" },
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        brand_name: settings.brand_name,
        brand_voice: settings.brand_voice,
        target_audience: settings.target_audience,
        brand_colors: settings.brand_colors,
      };

      const { error } = settings.id
        ? await supabase.from("brand_settings").update(payload).eq("id", settings.id)
        : await supabase.from("brand_settings").insert(payload).select("id").single().then(res => {
            if (res.data) setSettings(prev => ({ ...prev, id: res.data!.id }));
            return res;
          });

      if (error) throw error;
      toast.success("Configurações da marca salvas com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações da Marca</h1>
        <p className="text-muted-foreground mt-1">
          Personalize a identidade da sua marca. Essas informações são usadas pela IA para gerar conteúdo com o seu tom de voz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Identidade da Marca
          </CardTitle>
          <CardDescription>Defina como a IA deve se comunicar ao criar conteúdo para você.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="brand_name">Nome da Marca</Label>
            <Input
              id="brand_name"
              value={settings.brand_name}
              onChange={(e) => setSettings(prev => ({ ...prev, brand_name: e.target.value }))}
              placeholder="Ex: Minha Empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">Público-Alvo</Label>
            <Textarea
              id="target_audience"
              value={settings.target_audience}
              onChange={(e) => setSettings(prev => ({ ...prev, target_audience: e.target.value }))}
              placeholder="Ex: Gestores de tráfego de 25 a 40 anos que buscam escalar campanhas..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tom de Voz</Label>
            <Select value={settings.brand_voice} onValueChange={(v) => setSettings(prev => ({ ...prev, brand_voice: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color_primary">Cor Primária</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="color_primary"
                  value={settings.brand_colors.primary}
                  onChange={(e) => setSettings(prev => ({ ...prev, brand_colors: { ...prev.brand_colors, primary: e.target.value } }))}
                  className="h-10 w-14 rounded border border-border cursor-pointer"
                />
                <span className="text-sm font-mono text-muted-foreground">{settings.brand_colors.primary}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color_secondary">Cor Secundária</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="color_secondary"
                  value={settings.brand_colors.secondary}
                  onChange={(e) => setSettings(prev => ({ ...prev, brand_colors: { ...prev.brand_colors, secondary: e.target.value } }))}
                  className="h-10 w-14 rounded border border-border cursor-pointer"
                />
                <span className="text-sm font-mono text-muted-foreground">{settings.brand_colors.secondary}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[200px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
