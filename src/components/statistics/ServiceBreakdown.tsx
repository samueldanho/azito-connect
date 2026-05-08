import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useServiceBreakdown } from "@/hooks/useServiceBreakdown";
import type { PeriodType } from "@/hooks/useStatistics";
import { Layers, UserCheck, UserX, Droplet, Heart, Percent } from "lucide-react";
import { ServiceMembersDialog } from "./ServiceMembersDialog";

interface Props {
  period: PeriodType;
}

export const ServiceBreakdown = ({ period }: Props) => {
  const { data: rows = [], isLoading } = useServiceBreakdown(period);
  const [selected, setSelected] = useState<{ id: string; name: string; color: string } | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[220px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-muted-foreground text-sm">
        Aucun service à afficher
      </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {rows.map((s) => (
        <button
          type="button"
          key={s.id}
          onClick={() => setSelected({ id: s.id, name: s.name, color: s.color })}
          className="glass-card p-5 hover:shadow-elevated transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-2 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg text-foreground truncate flex items-center gap-2">
                  <Layers className="w-4 h-4" style={{ color: s.color }} />
                  {s.name}
                </h3>
                <span className="text-xs text-muted-foreground">{s.totalMembers} membres</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Metric
              icon={UserCheck}
              label="Actifs"
              value={s.activeMembers}
              total={s.totalMembers}
              color="text-success"
              bg="bg-success/10"
            />
            <Metric
              icon={UserX}
              label="Inactifs"
              value={s.inactiveMembers}
              total={s.totalMembers}
              color="text-destructive"
              bg="bg-destructive/10"
            />
            <Metric
              icon={Droplet}
              label="Baptisés"
              value={s.baptizedMembers}
              total={s.totalMembers}
              color="text-primary"
              bg="bg-primary/10"
            />
            <Metric
              icon={Droplet}
              label="Non baptisés"
              value={s.nonBaptizedMembers}
              total={s.totalMembers}
              color="text-muted-foreground"
              bg="bg-muted"
            />
          </div>

          {/* Bars */}
          <div className="space-y-3">
            <RateBar
              icon={Percent}
              label="Taux de présence"
              rate={s.presenceRate}
              caption={`${s.totalPresent}/${s.totalPresences}`}
              color={s.color}
            />
            <RateBar
              icon={Heart}
              label="Fidélité (≥80%)"
              rate={s.fidelityRate}
              caption="membres assidus"
              color={s.color}
            />
          </div>
        </button>
      ))}
    </div>
    <ServiceMembersDialog
      open={!!selected}
      onOpenChange={(o) => !o && setSelected(null)}
      service={selected}
      period={period}
    />
    </>
  );
};

const Metric = ({
  icon: Icon, label, value, total, color, bg,
}: {
  icon: typeof UserCheck; label: string; value: number; total: number; color: string; bg: string;
}) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/50">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {value} <span className="text-xs text-muted-foreground font-normal">({pct}%)</span>
        </p>
      </div>
    </div>
  );
};

const RateBar = ({
  icon: Icon, label, rate, caption, color,
}: {
  icon: typeof Percent; label: string; rate: number; caption: string; color: string;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        {label}
      </div>
      <div className="text-xs">
        <span className="font-bold text-foreground">{rate}%</span>
        <span className="text-muted-foreground ml-1">· {caption}</span>
      </div>
    </div>
    <div className="h-2 bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${rate}%`, backgroundColor: color }}
      />
    </div>
  </div>
);
