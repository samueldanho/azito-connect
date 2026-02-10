import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useResponsables } from "@/hooks/useResponsables";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserCog, Shield, ShieldOff, Layers, Mail, Phone } from "lucide-react";

const Responsables = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { responsables, isLoading, assignRole, removeRole, assignService } = useResponsables();

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id, nom, couleur").order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof responsables[0] | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("none");

  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; role: "berger" | "responsable_service"; name: string } | null>(null);

  const openAssignDialog = (user: typeof responsables[0]) => {
    setSelectedUser(user);
    setSelectedServiceId(user.service_id || "none");
    setAssignDialogOpen(true);
  };

  const handleAssignResponsable = () => {
    if (!selectedUser) return;
    const serviceId = selectedServiceId === "none" ? null : selectedServiceId;

    // Assign service
    assignService.mutate({ userId: selectedUser.id, serviceId });

    // Assign role if not already responsable
    if (!selectedUser.isResponsable) {
      assignRole.mutate({ userId: selectedUser.id, role: "responsable_service" });
    }

    setAssignDialogOpen(false);
  };

  const handleRemoveRole = () => {
    if (!removeTarget) return;
    removeRole.mutate({ userId: removeTarget.userId, role: removeTarget.role });
    // Also clear service_id if removing responsable role
    if (removeTarget.role === "responsable_service") {
      assignService.mutate({ userId: removeTarget.userId, serviceId: null });
    }
    setRemoveConfirmOpen(false);
  };

  const currentResponsables = responsables.filter((r) => r.isResponsable || r.isBerger);
  const otherUsers = responsables.filter((r) => !r.isResponsable && !r.isBerger);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <DashboardSidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <DashboardSidebar isCollapsed={false} onToggle={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:ml-20" : "lg:ml-64")}>
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="p-4 lg:p-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-foreground mb-1">Responsables</h1>
              <p className="text-muted-foreground text-sm">Gérez les rôles et les accès des responsables de service</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[80px] rounded-xl" />)}
            </div>
          ) : (
            <>
              {/* Current responsables & bergers */}
              <div className="mb-8">
                <h2 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Responsables actuels ({currentResponsables.length})
                </h2>

                {currentResponsables.length === 0 ? (
                  <div className="glass-card p-8 text-center text-muted-foreground text-sm">
                    Aucun responsable assigné
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {currentResponsables.map((user) => (
                      <div key={user.id} className="glass-card p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{user.nom_complet}</h3>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {user.isBerger && <Badge variant="default" className="text-xs">Berger</Badge>}
                              {user.isResponsable && <Badge variant="secondary" className="text-xs">Responsable</Badge>}
                            </div>
                          </div>
                          {user.isResponsable && !user.isBerger && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setRemoveTarget({ userId: user.id, role: "responsable_service", name: user.nom_complet });
                                setRemoveConfirmOpen(true);
                              }}
                            >
                              <ShieldOff className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {user.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" /> {user.email}
                          </div>
                        )}
                        {user.telephone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" /> {user.telephone}
                          </div>
                        )}

                        {user.service && (
                          <div className="flex items-center gap-2 text-sm">
                            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: user.service.couleur || "#D97706" }} />
                              <span className="font-medium text-foreground">{user.service.nom}</span>
                            </span>
                          </div>
                        )}

                        {user.isResponsable && (
                          <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => openAssignDialog(user)}>
                            Modifier le service
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other users */}
              <div>
                <h2 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-muted-foreground" />
                  Autres utilisateurs ({otherUsers.length})
                </h2>

                {otherUsers.length === 0 ? (
                  <div className="glass-card p-8 text-center text-muted-foreground text-sm">
                    Tous les utilisateurs ont un rôle assigné
                  </div>
                ) : (
                  <div className="glass-card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground bg-muted/30">
                          <th className="text-left py-3 px-4 font-medium">Nom</th>
                          <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Email</th>
                          <th className="text-right py-3 px-4 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otherUsers.map((user) => (
                          <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4 font-medium text-foreground">{user.nom_complet}</td>
                            <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{user.email || "—"}</td>
                            <td className="py-3 px-4 text-right">
                              <Button variant="outline" size="sm" onClick={() => openAssignDialog(user)}>
                                <Shield className="w-3.5 h-3.5 mr-1.5" />
                                Nommer responsable
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.isResponsable ? "Modifier le service" : "Nommer responsable"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.isResponsable
                ? `Changez le service assigné à ${selectedUser?.nom_complet}`
                : `Assignez ${selectedUser?.nom_complet} comme responsable d'un service`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-foreground mb-2 block">Service</label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun service</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.couleur || "#D97706" }} />
                      {s.nom}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAssignResponsable} disabled={assignRole.isPending || assignService.isPending}>
              {selectedUser?.isResponsable ? "Mettre à jour" : "Nommer responsable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirm */}
      <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le rôle de responsable ?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.name} perdra ses accès de responsable de service. Cette action est réversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Retirer le rôle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Responsables;
