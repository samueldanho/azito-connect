import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Church, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TypeActivite } from "@/hooks/usePresences";
import { Tables } from "@/integrations/supabase/types";

interface PresenceFiltersProps {
  date: Date;
  onDateChange: (date: Date) => void;
  typeActivite: TypeActivite;
  onTypeActiviteChange: (type: TypeActivite) => void;
  serviceFilter: string;
  onServiceFilterChange: (serviceId: string) => void;
  services: Tables<"services">[];
}

const activityTypes: { value: TypeActivite; label: string; icon: React.ReactNode }[] = [
  { value: "culte", label: "Culte", icon: <Church className="h-4 w-4" /> },
  { value: "reunion", label: "Réunion", icon: <Users className="h-4 w-4" /> },
  { value: "activite_speciale", label: "Activité spéciale", icon: <Sparkles className="h-4 w-4" /> },
];

export const PresenceFilters = ({
  date,
  onDateChange,
  typeActivite,
  onTypeActiviteChange,
  serviceFilter,
  onServiceFilterChange,
  services,
}: PresenceFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal w-full sm:w-[220px]",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: fr }) : "Choisir une date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onDateChange(d)}
            initialFocus
            locale={fr}
          />
        </PopoverContent>
      </Popover>

      {/* Activity Type Selector */}
      <div className="flex gap-2">
        {activityTypes.map((type) => (
          <Button
            key={type.value}
            variant={typeActivite === type.value ? "default" : "outline"}
            size="sm"
            onClick={() => onTypeActiviteChange(type.value)}
            className="gap-2"
          >
            {type.icon}
            <span className="hidden sm:inline">{type.label}</span>
          </Button>
        ))}
      </div>

      {/* Service Filter */}
      <Select value={serviceFilter} onValueChange={onServiceFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tous les services" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les services</SelectItem>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: service.couleur || "#D97706" }}
                />
                {service.nom}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
