import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ServiceData {
  id: string;
  name: string;
  color: string;
  memberCount: number;
}

interface ServiceDistributionChartProps {
  data: ServiceData[];
}

export const ServiceDistributionChart = ({ data }: ServiceDistributionChartProps) => {
  const chartConfig: ChartConfig = data.reduce((acc, s) => {
    acc[s.name] = { label: s.name, color: s.color };
    return acc;
  }, {} as ChartConfig);

  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-display text-lg text-foreground mb-4">
          Membres par service
        </h3>
        <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
          Aucun service configuré
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg text-foreground mb-4">
        Membres par service
      </h3>
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <Bar dataKey="memberCount" radius={[6, 6, 0, 0]} name="Membres">
            {data.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
};
