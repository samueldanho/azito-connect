import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bus, Users, UserPlus, Trash2, Search, Copy, Plus, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRCodeShare from "@/components/shared/QRCodeShare";

const BusCenterDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [newZoneName, setNewZoneName] = useState("");
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch zones
  const { data: zones = [] } = useQuery({
    queryKey: ["bus-center-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bus_center_zones")
        .select("*")
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["bus-center"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bus_center")
        .select("*, bus_center_zones(nom)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("bus-center-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bus_center" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bus-center"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bus_center").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bus-center"] });
      toast({ title: "Supprimé", description: "Entrée supprimée" });
    },
  });

  // Zone mutations
  const addZoneMutation = useMutation({
    mutationFn: async (nom: string) => {
      const { error } = await supabase.from("bus_center_zones").insert({ nom });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bus-center-zones"] });
      setNewZoneName("");
      toast({ title: "Zone ajoutée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter la zone", variant: "destructive" });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bus_center_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bus-center-zones"] });
      toast({ title: "Zone supprimée" });
    },
  });

  const handleAddZone = () => {
    if (!newZoneName.trim() || newZoneName.trim().length < 2) return;
    addZoneMutation.mutate(newZoneName.trim());
  };

  const filtered = entries.filter((e: any) => {
    const matchesSearch = `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase());
    const matchesZone =
      zoneFilter === "all"
        ? true
        : zoneFilter === "none"
        ? !e.zone_id
        : e.zone_id === zoneFilter;
    return matchesSearch && matchesZone;
  });

  const totalAnciens = filtered.reduce((s: number, e: any) => s + (e.nombre_anciens || 0), 0);
  const totalNouveaux = filtered.reduce((s: number, e: any) => s + (e.nombre_nouveaux || 0), 0);

  const formUrl = `${window.location.origin}/bus-center`;

  const copyLink = () => {
    navigator.clipboard.writeText(formUrl);
    toast({ title: "Lien copié", description: "Le lien du formulaire bus-center a été copié" });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:ml-20" : "lg:ml-64")}>
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="p-4 lg:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl text-foreground">Bus-Center</h1>
              <p className="text-muted-foreground text-sm mt-1">Suivi des arrivées du dimanche</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MapPin className="w-4 h-4 mr-2" /> Gérer les zones
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Zones de Bus-Center</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nom de la zone..."
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddZone()}
                      />
                      <Button onClick={handleAddZone} disabled={addZoneMutation.isPending}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {zones.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucune zone créée</p>
                      ) : (
                        zones.map((z: any) => (
                          <div key={z.id} className="flex items-center justify-between p-2 rounded-md border border-border">
                            <span className="text-sm text-foreground">{z.nom}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteZoneMutation.mutate(z.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={copyLink}>
                <Copy className="w-4 h-4 mr-2" /> Copier le lien
              </Button>
              <QRCodeShare
                url={formUrl}
                title="QR Code Bus-Center"
                triggerVariant="outline"
                triggerSize="sm"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total entrées</p>
                  <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total anciens</p>
                  <p className="text-2xl font-bold text-foreground">{totalAnciens}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total nouveaux</p>
                  <p className="text-2xl font-bold text-foreground">{totalNouveaux}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search + Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Rechercher par nom ou prénom..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Select value={zoneFilter} onValueChange={setZoneFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrer par zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les zones</SelectItem>
                      <SelectItem value="none">Sans zone</SelectItem>
                      {zones.map((z: any) => (
                        <SelectItem key={z.id} value={z.id}>{z.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Heure départ</TableHead>
                    <TableHead>Anciens</TableHead>
                    <TableHead>Nouveaux</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Chargement...</TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucune entrée</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.nom}</TableCell>
                        <TableCell>{e.prenom}</TableCell>
                        <TableCell>{e.bus_center_zones?.nom || "—"}</TableCell>
                        <TableCell>{e.heure_depart}</TableCell>
                        <TableCell>{e.nombre_anciens}</TableCell>
                        <TableCell>{e.nombre_nouveaux}</TableCell>
                        <TableCell>{format(new Date(e.date_dimanche), "dd MMM yyyy", { locale: fr })}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(e.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default BusCenterDashboard;
