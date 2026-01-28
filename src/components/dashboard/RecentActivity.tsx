import { cn } from "@/lib/utils";
import { UserPlus, UserCheck, Edit, Trash2, LogIn } from "lucide-react";

type ActivityType = "add" | "presence" | "edit" | "delete" | "login";

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  user: string;
  time: string;
}

const activityConfig: Record<ActivityType, { icon: typeof UserPlus; color: string }> = {
  add: { icon: UserPlus, color: "text-success bg-success/10" },
  presence: { icon: UserCheck, color: "text-primary bg-primary/10" },
  edit: { icon: Edit, color: "text-accent bg-accent/10" },
  delete: { icon: Trash2, color: "text-destructive bg-destructive/10" },
  login: { icon: LogIn, color: "text-muted-foreground bg-muted" },
};

const mockActivities: Activity[] = [
  { id: "1", type: "add", description: "Nouveau membre ajouté", user: "Jean Koffi", time: "Il y a 5 min" },
  { id: "2", type: "presence", description: "Présence marquée - Culte", user: "Marie Diallo", time: "Il y a 15 min" },
  { id: "3", type: "login", description: "Connexion au système", user: "Resp. Louange", time: "Il y a 30 min" },
  { id: "4", type: "edit", description: "Profil membre modifié", user: "Paul Mensah", time: "Il y a 1h" },
  { id: "5", type: "presence", description: "Présence marquée - Réunion", user: "Sarah Ouedraogo", time: "Il y a 2h" },
];

export const RecentActivity = () => {
  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg text-foreground mb-4">
        Activité récente
      </h3>
      
      <div className="space-y-3">
        {mockActivities.map((activity) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;
          
          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.user}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
