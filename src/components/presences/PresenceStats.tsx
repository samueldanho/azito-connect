import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PresenceStatsProps {
  totalMembers: number;
  presentCount: number;
  absentCount: number;
  rate: number;
}

export const PresenceStats = ({
  totalMembers,
  presentCount,
  absentCount,
  rate,
}: PresenceStatsProps) => {
  const stats = [
    {
      label: "Total membres",
      value: totalMembers,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Présents",
      value: presentCount,
      icon: UserCheck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Absents",
      value: absentCount,
      icon: UserX,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Taux présence",
      value: `${rate}%`,
      icon: TrendingUp,
      color: rate >= 70 ? "text-success" : rate >= 50 ? "text-warning" : "text-destructive",
      bgColor: rate >= 70 ? "bg-success/10" : rate >= 50 ? "bg-warning/10" : "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-none shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
