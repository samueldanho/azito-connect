import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface MembersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  serviceFilter: string;
  onServiceFilterChange: (value: string) => void;
  baptismFilter: string;
  onBaptismFilterChange: (value: string) => void;
  services: Service[];
}

export const MembersFilters = ({
  search,
  onSearchChange,
  serviceFilter,
  onServiceFilterChange,
  baptismFilter,
  onBaptismFilterChange,
  services,
}: MembersFiltersProps) => {
  const hasFilters = search || serviceFilter || baptismFilter;

  const clearFilters = () => {
    onSearchChange("");
    onServiceFilterChange("");
    onBaptismFilterChange("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un membre..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
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

      {/* Baptism Filter */}
      <Select value={baptismFilter} onValueChange={onBaptismFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Statut baptême" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="baptise">Baptisé</SelectItem>
          <SelectItem value="non_baptise">Non baptisé</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
