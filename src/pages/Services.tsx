import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ServiceForm } from "@/components/services/ServiceForm";
import { DeleteServiceDialog } from "@/components/services/DeleteServiceDialog";
import { useServices } from "@/hooks/useMembers";
import { useServicesManagement, ServiceInsert } from "@/hooks/useServicesManagement";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Service = Tables<"services">;

const Services = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Service | null>(null);

  const { data: services = [], isLoading } = useServices();
  const { createService, updateService, deleteService } = useServicesManagement();

  const handleAdd = () => { setSelected(null); setFormOpen(true); };
  const handleEdit = (s: Service) => { setSelected(s); setFormOpen(true); };
  const handleDeleteClick = (s: Service) => { setSelected(s); setDeleteOpen(true); };

  const handleSubmit = (data: ServiceInsert) => {
    if (selected) {
      updateService.mutate({ id: selected.id, ...data }, { onSuccess: () => setFormOpen(false) });
    } else {
      createService.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleDeleteConfirm = () => {
    if (selected) {
      deleteService.mutate(selected.id, {
        onSuccess: () => { setDeleteOpen(false); setSelected(null); },
      });
    }
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="animate-fade-in">
              <h1 className="font-display text-2xl lg:text-3xl text-foreground">Gestion des services</h1>
              <p className="text-muted-foreground mt-1">
                {services.length} service{services.length > 1 ? "s" : ""} enregistré{services.length > 1 ? "s" : ""}
              </p>
            </div>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau service
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg text-foreground mb-2">Aucun service</h3>
              <p className="text-muted-foreground max-w-sm">
                Commencez par créer votre premier service (ministère) pour organiser les membres.
              </p>
              <Button onClick={handleAdd} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Créer un service
              </Button>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Couleur</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden sm:table-cell">Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div
                          className="w-5 h-5 rounded-full border border-border"
                          style={{ backgroundColor: service.couleur || "#D97706" }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{service.nom}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                        {service.description || "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {format(new Date(service.created_at), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(service)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </main>
      </div>

      <ServiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        service={selected}
        onSubmit={handleSubmit}
        isLoading={createService.isPending || updateService.isPending}
      />

      <DeleteServiceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        service={selected}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteService.isPending}
      />
    </div>
  );
};

export default Services;
