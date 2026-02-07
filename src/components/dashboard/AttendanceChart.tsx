import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface AttendanceChartProps {
  data: { date: string; present: number; absent: number; total: number; rate: number }[];
}

const chartConfig: ChartConfig = {
  present: { label: "Présents", color: "hsl(145, 50%, 35%)" },
  absent: { label: "Absents", color: "hsl(0, 72%, 51%)" },
};

export const AttendanceChart = ({ data }: AttendanceChartProps) => {
  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "dd MMM", { locale: fr }),
  }));

  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-display text-lg text-foreground mb-4">
          Évolution des présences
        </h3>
        <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
          Aucune donnée de présence sur les 30 derniers jours
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg text-foreground mb-4">
        Évolution des présences (30 jours)
      </h3>
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <AreaChart data={formatted} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="present"
            stackId="1"
            stroke="var(--color-present)"
            fill="var(--color-present)"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="absent"
            stackId="1"
            stroke="var(--color-absent)"
            fill="var(--color-absent)"
            fillOpacity={0.15}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};
