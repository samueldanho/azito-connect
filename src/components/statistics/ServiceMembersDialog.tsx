import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useServiceMembersStats, type FidelityStatus } from "@/hooks/useServiceMembersStats";
import type { PeriodType } from "@/hooks/useStatistics";
import { Layers } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service: { id: string; name: string; color: string } | null;
  period: PeriodType;
}

const STATUS_LABEL: Record<FidelityStatus, { label: string; className: string }> = {
  fidele: { label: "Fidèle", className: "bg-success/10 text-success" },
  regulier: { label: "Régulier", className: "bg-primary/10 text-primary" },
  irregulier: { label: "Irrégulier", className: "bg-amber-500/10 text-amber-600" },
  absent: { label: "Absent", className: "bg-destructive/10 text-destructive" },
  non_suivi: { label: "Non suivi", className: "bg-muted text-muted-foreground" },
};

export const ServiceMembersDialog = ({ open, onOpenChange, service, period }: Props) => {
  const { data: members = [], isLoading } = useServiceMembersStats(service?.id ?? null, period);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Layers className="w-5 h-5" style={{ color: service?.color }} />
            {service?.name}
          </DialogTitle>
          <DialogDescription>
            Membres, taux de présence et fidélité sur la période sélectionnée
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Aucun membre dans ce service</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2 font-medium">Membre</th>
                  <th className="text-center py-2 px-2 font-medium">Présences</th>
                  <th className="text-center py-2 px-2 font-medium">Taux</th>
                  <th className="text-right py-2 px-2 font-medium">Fidélité</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const s = STATUS_LABEL[m.status];
                  return (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            m.est_actif ? "bg-success" : "bg-muted-foreground"
                          )} />
                          <span className="font-medium text-foreground">{m.nom_complet}</span>
                          {m.statut_bapteme === "baptise" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">B</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center text-muted-foreground">
                        {m.present}/{m.total}
                      </td>
                      <td className="py-2.5 px-2 text-center font-semibold text-foreground">
                        {m.total > 0 ? `${m.rate}%` : "—"}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-semibold", s.className)}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
