import { cn } from "@/lib/utils";
import { Users, TrendingUp } from "lucide-react";

interface ServiceCardProps {
  name: string;
  memberCount: number;
  presentCount: number;
  responsable: string;
  color: string;
}

export const ServiceCard = ({
  name,
  memberCount,
  presentCount,
  responsable,
  color,
}: ServiceCardProps) => {
  const attendanceRate = Math.round((presentCount / memberCount) * 100);

  return (
    <div className="glass-card p-5 hover:shadow-elevated transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div
          className="w-3 h-12 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            Resp: {responsable}
          </p>
          
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {memberCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">
                {attendanceRate}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${attendanceRate}%`,
            backgroundColor: color 
          }}
        />
      </div>
    </div>
  );
};
