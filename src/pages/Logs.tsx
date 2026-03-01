import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, UserCheck, Edit, Trash2, LogIn, Settings, Search, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Tables } from "@/integrations/supabase/types";

type ActivityLog = Tables<"activity_logs">;

const actionConfig: Record<string, { icon: typeof UserPlus; color: string; label: string }> = {
  ajout_membre: { icon: UserPlus, color: "bg-green-500/10 text-green-600", label: "Ajout membre" },
  marquage_presence: { icon: UserCheck, color: "bg-primary/10 text-primary", label: "Présence" },
  modification_membre: { icon: Edit, color: "bg-amber-500/10 text-amber-600", label: "Modification membre" },
  suppression_membre: { icon: Trash2, color: "bg-destructive/10 text-destructive", label: "Suppression membre" },
  connexion: { icon: LogIn, color: "bg-muted text-muted-foreground", label: "Connexion" },
  creation_service: { icon: Settings, color: "bg-blue-500/10 text-blue-600", label: "Création service" },
  modification_service: { icon: Settings, color: "bg-amber-500/10 text-amber-600", label: "Modification service" },
};

const Logs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as ActivityLog[];
    },
  });

  const filtered = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (search && !log.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar isCollapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Logs CRM</h1>
              <p className="text-sm text-muted-foreground">Historique complet des actions</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="connexion">Connexion</SelectItem>
                <SelectItem value="ajout_membre">Ajout membre</SelectItem>
                <SelectItem value="modification_membre">Modification membre</SelectItem>
                <SelectItem value="suppression_membre">Suppression membre</SelectItem>
                <SelectItem value="marquage_presence">Présence</SelectItem>
                <SelectItem value="creation_service">Création service</SelectItem>
                <SelectItem value="modification_service">Modification service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead className="w-[160px]">Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[120px]">Entité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        Aucun log trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((log) => {
                      const config = actionConfig[log.action] ?? actionConfig.connexion;
                      const Icon = config.icon;
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(parseISO(log.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`gap-1.5 ${config.color}`}>
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.description}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.entite_type ?? "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          <p className="text-xs text-muted-foreground text-right">
            {filtered.length} entrée{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
          </p>
        </main>
      </div>
    </div>
  );
};

export default Logs;
