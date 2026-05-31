import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useResponsables } from "@/hooks/useResponsables";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Phone, Search, UserCog, Trash2, Layers, Shield } from "lucide-react";

type RoleFilter = "all" | "berger" | "responsable_service" | "none";
type RoleChoice = "none" | "berger" | "responsable_service";

const Comptes = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { responsables, isLoading, assignRole, removeRole, assignService, deleteUser } = useResponsables();

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id, nom, couleur").order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<typeof responsables[0] | null>(null);
  const [editRole, setEditRole] = useState<RoleChoice>("none");
  const [editServiceId, setEditServiceId] = useState<string>("none");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return responsables.filter((u) => {
      if (q && !`${u.nom_complet} ${u.email ?? ""}`.toLowerCase().includes(q)) return false;
      if (roleFilter === "berger" && !u.isBerger) return false;
      if (roleFilter === "responsable_service" && !u.isResponsable) return false;
      if (roleFilter === "none" && (u.isBerger || u.isResponsable)) return false;
      if (serviceFilter !== "all") {
        if (serviceFilter === "none" && u.service_id) return false;
        if (serviceFilter !== "none" && u.service_id !== serviceFilter) return false;
      }
      return true;
    });
  }, [responsables, search, roleFilter, serviceFilter]);

  const openEdit = (u: typeof responsables[0]) => {
    setEditUser(u);
    setEditRole(u.isBerger ? "berger" : u.isResponsable ? "responsable_service" : "none");
    setEditServiceId(u.service_id || "none");
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editUser) return;
    const userId = editUser.id;

    // Sync roles
    const wasBerger = editUser.isBerger;
    const wasResp = editUser.isResponsable;
    const willBerger = editRole === "berger";
    const willResp = editRole === "responsable_service";

    const ops: Promise<unknown>[] = [];
    if (wasBerger && !willBerger) ops.push(removeRole.mutateAsync({ userId, role: "berger" }));
    if (!wasBerger && willBerger) ops.push(assignRole.mutateAsync({ userId, role: "berger" }));
    if (wasResp && !willResp) ops.push(removeRole.mutateAsync({ userId, role: "responsable_service" }));
    if (!wasResp && willResp) ops.push(assignRole.mutateAsync({ userId, role: "responsable_service" }));

    // Service: only meaningful for responsable_service; clear otherwise
    const targetService = willResp ? (editServiceId === "none" ? null : editServiceId) : null;
    if ((editUser.service_id ?? null) !== targetService) {
      ops.push(assignService.mutateAsync({ userId, serviceId: targetService }));
    }

    await Promise.all(ops);
    setEditOpen(false);
  };

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
          <div className="mb-6">
            <h1 className="font-display text-3xl text-foreground mb-1">Gestion des comptes</h1>
            <p className="text-muted-foreground text-sm">
              Visualisez tous les comptes, filtrez et mettez à jour leurs rôles et services
            </p>
          </div>

          {/* Filters */}
          <div className="glass-card p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (nom, email)"
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger><SelectValue placeholder="Rôle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="berger">Berger</SelectItem>
                <SelectItem value="responsable_service">Responsable de service</SelectItem>
                <SelectItem value="none">Sans rôle</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger><SelectValue placeholder="Service" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les services</SelectItem>
                <SelectItem value="none">Sans service</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-10 text-center text-muted-foreground text-sm">
              Aucun compte ne correspond aux filtres.
            </div>
          ) : (
            <div className="glass-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">Utilisateur</th>
                    <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Contact</th>
                    <th className="text-left py-3 px-4 font-medium">Rôle</th>
                    <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Service</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{u.nom_complet}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                        <div className="space-y-0.5">
                          {u.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{u.email}</div>}
                          {u.telephone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{u.telephone}</div>}
                          {!u.email && !u.telephone && <span>—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.isBerger ? (
                          <Badge variant="default" className="text-xs">Berger</Badge>
                        ) : u.isResponsable ? (
                          <Badge variant="secondary" className="text-xs">Responsable</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Aucun</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {u.service ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: u.service.couleur || "#D97706" }} />
                            <span className="font-medium text-foreground">{u.service.nom}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                            <UserCog className="w-3.5 h-3.5 mr-1.5" />
                            Modifier
                          </Button>
                          {!u.isBerger && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => setDeleteTarget({ id: u.id, name: u.nom_complet })}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Mettre à jour le compte
            </DialogTitle>
            <DialogDescription>
              {editUser?.nom_complet} — choisissez son rôle et, si responsable, son service.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Rôle</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as RoleChoice)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun rôle</SelectItem>
                  <SelectItem value="responsable_service">Responsable de service</SelectItem>
                  <SelectItem value="berger">Berger (Admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editRole === "responsable_service" && (
              <div>
                <Label className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Service</Label>
                <Select value={editServiceId} onValueChange={setEditServiceId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un service" /></SelectTrigger>
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
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={assignRole.isPending || removeRole.isPending || assignService.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteUser.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Comptes;
