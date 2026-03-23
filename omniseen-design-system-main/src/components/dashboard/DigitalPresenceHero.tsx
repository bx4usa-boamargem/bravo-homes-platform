import { useNavigate } from "react-router-dom";
import { Plus, BarChart3, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PerformanceModal from "./PerformanceModal";

interface DigitalPresenceHeroProps {
  articleCount: number;
  avgPosition: number;
  monthlyVisits: number;
  gmbRating: number;
  presenceScore: number;
  scoreChange: number;
  opportunitiesCount: number;
}

export default function DigitalPresenceHero({
  articleCount,
  avgPosition,
  monthlyVisits,
  gmbRating,
  presenceScore,
  scoreChange,
  opportunitiesCount,
}: DigitalPresenceHeroProps) {
  const navigate = useNavigate();
  const [showPerformance, setShowPerformance] = useState(false);

  const formatVisits = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v.toString();
  };

  // SVG circle for score
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = (presenceScore / 100) * circumference;

  return (
    <>
      <div className="rounded-2xl p-6 md:p-8 bg-[hsl(var(--hero-bg))] text-[hsl(var(--hero-fg))]">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="relative w-[140px] h-[140px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke="hsl(var(--hero-card))"
                  strokeWidth="8"
                />
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke="hsl(var(--hero-accent))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{presenceScore}</span>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-[hsl(var(--hero-muted))]">
                  SCORE
                </span>
              </div>
            </div>
          </div>

          {/* Right side content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold mb-1">
              Sua presença digital está{" "}
              <span className="text-[hsl(var(--hero-accent))]">crescendo</span>
            </h2>
            <p className="text-sm text-[hsl(var(--hero-muted))] mb-6 max-w-lg">
              Você subiu +{scoreChange} pontos no Score de Presença este mês. Os agentes identificaram{" "}
              {opportunitiesCount} novas oportunidades de conteúdo que seus concorrentes não cobriram ainda.
            </p>

            {/* KPI Row */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
              {[
                { label: "Artigos", value: articleCount.toString(), change: "↑2" },
                { label: "Posição média", value: `${avgPosition}ª`, change: "↑2" },
                { label: "Visitas/mês", value: formatVisits(monthlyVisits), change: "↑18%" },
                {
                  label: "Avaliação GMB",
                  value: gmbRating.toFixed(1),
                  icon: <Star className="h-3.5 w-3.5 fill-warning text-warning" />,
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-[hsl(var(--hero-card))] rounded-lg px-4 py-2.5 min-w-[100px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold">{kpi.value}</span>
                    {kpi.icon}
                    {kpi.change && (
                      <span className="text-[10px] font-semibold text-[hsl(var(--hero-accent))]">
                        {kpi.change}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[hsl(var(--hero-muted))]">{kpi.label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Button
                onClick={() => navigate("/client/radar")}
                variant="outline"
                className="border-[hsl(var(--hero-muted)/0.3)] text-[hsl(var(--hero-fg))] bg-transparent hover:bg-[hsl(var(--hero-card))] gap-1.5"
              >
                <Plus className="h-4 w-4" /> Ver Oportunidades
              </Button>
              <Button
                onClick={() => navigate("/client/articles/new")}
                variant="outline"
                className="border-[hsl(var(--hero-muted)/0.3)] text-[hsl(var(--hero-fg))] bg-transparent hover:bg-[hsl(var(--hero-card))] gap-1.5"
              >
                <Plus className="h-4 w-4" /> Criar Artigo
              </Button>
              <Button
                onClick={() => setShowPerformance(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                <BarChart3 className="h-4 w-4" /> Ver Performance
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PerformanceModal open={showPerformance} onClose={() => setShowPerformance(false)} />
    </>
  );
}
