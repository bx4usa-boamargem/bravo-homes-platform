import { useState } from "react";
import { Calendar, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SchedulePublishDialogProps {
  articleId: string;
  currentScheduledAt: string | null;
  onScheduled: (scheduledAt: string | null, status: string) => void;
  onClose: () => void;
}

export default function SchedulePublishDialog({
  articleId,
  currentScheduledAt,
  onScheduled,
  onClose,
}: SchedulePublishDialogProps) {
  // Default to tomorrow at 9:00
  const getDefaultDate = () => {
    if (currentScheduledAt) {
      return currentScheduledAt.slice(0, 16); // ISO to datetime-local format
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const [dateTime, setDateTime] = useState(getDefaultDate());
  const [saving, setSaving] = useState(false);

  const handleSchedule = async () => {
    if (!dateTime) return;
    setSaving(true);
    const scheduledAt = new Date(dateTime).toISOString();
    const { error } = await supabase
      .from("articles")
      .update({ status: "scheduled", scheduled_at: scheduledAt })
      .eq("id", articleId);

    if (error) {
      toast.error("Erro ao agendar publicação");
    } else {
      toast.success(`Artigo agendado para ${new Date(scheduledAt).toLocaleString("pt-BR")}`);
      onScheduled(scheduledAt, "scheduled");
    }
    setSaving(false);
    onClose();
  };

  const handleCancelSchedule = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("articles")
      .update({ status: "draft", scheduled_at: null })
      .eq("id", articleId);

    if (error) {
      toast.error("Erro ao cancelar agendamento");
    } else {
      toast.success("Agendamento cancelado");
      onScheduled(null, "draft");
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-space-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-space-5">
          <h3 className="text-h3 text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agendar Publicação
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-space-5">
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">
              Data e Hora
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="pl-10"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <p className="text-caption text-muted-foreground mt-space-2">
              O artigo será publicado automaticamente na data e hora selecionadas.
            </p>
          </div>

          <div className="flex gap-space-3">
            <Button onClick={handleSchedule} disabled={saving || !dateTime} className="flex-1">
              {saving ? "Salvando..." : "Agendar Publicação"}
            </Button>
            {currentScheduledAt && (
              <Button
                variant="destructive"
                onClick={handleCancelSchedule}
                disabled={saving}
                className="shrink-0"
              >
                Cancelar Agendamento
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
