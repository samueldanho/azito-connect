import { cn } from "@/lib/utils";
import { UserPlus, UserCheck, Edit, Trash2, LogIn, Settings } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Tables } from "@/integrations/supabase/types";

type ActivityLog = Tables<"activity_logs">;

const actionConfig: Record<string, { icon: typeof UserPlus; color: string; label: string }> = {
  ajout_membre: { icon: UserPlus, color: "text-success bg-success/10", label: "Membre ajouté" },
  marquage_presence: { icon: UserCheck, color: "text-primary bg-primary/10", label: "Présence marquée" },
  modification_membre: { icon: Edit, color: "text-accent bg-accent/10", label: "Membre modifié" },
  suppression_membre: { icon: Trash2, color: "text-destructive bg-destructive/10", label: "Membre supprimé" },
  connexion: { icon: LogIn, color: "text-muted-foreground bg-muted", label: "Connexion" },
  creation_service: { icon: Settings, color: "text-primary bg-primary/10", label: "Service créé" },
  modification_service: { icon: Settings, color: "text-accent bg-accent/10", label: "Service modifié" },
};

interface RecentActivityProps {
  activities: ActivityLog[];
}

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  const hasData = activities.length > 0;

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg text-foreground mb-4">
        Activité récente
      </h3>

      {!hasData ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucune activité récente
        </p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const config = actionConfig[activity.action] ?? actionConfig.connexion;
            const Icon = config.icon;
            const timeAgo = formatDistanceToNow(parseISO(activity.created_at), {
              addSuffix: true,
              locale: fr,
            });

            return (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", config.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {timeAgo}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
