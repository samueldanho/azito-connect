import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MemberCard } from "@/components/members/MemberCard";
import { MemberForm } from "@/components/members/MemberForm";
import { DeleteMemberDialog } from "@/components/members/DeleteMemberDialog";
import { MembersFilters } from "@/components/members/MembersFilters";
import { useMembers, useServices, Member, MemberInsert } from "@/hooks/useMembers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Users } from "lucide-react";

const Members = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [baptismFilter, setBaptismFilter] = useState("");

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const { members, isLoading, createMember, updateMember, deleteMember } = useMembers();
  const { data: services = [] } = useServices();

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      const searchMatch =
        !search ||
        member.nom_complet.toLowerCase().includes(search.toLowerCase()) ||
        member.telephone?.toLowerCase().includes(search.toLowerCase()) ||
        member.lieu_habitation?.toLowerCase().includes(search.toLowerCase());

      // Service filter
      const serviceMatch =
        !serviceFilter || serviceFilter === "all" || member.service_id === serviceFilter;

      // Baptism filter
      const baptismMatch =
        !baptismFilter || baptismFilter === "all" || member.statut_bapteme === baptismFilter;

      return searchMatch && serviceMatch && baptismMatch;
    });
  }, [members, search, serviceFilter, baptismFilter]);

  const handleAddMember = () => {
    setSelectedMember(null);
    setFormOpen(true);
  };

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setFormOpen(true);
  };

  const handleDeleteClick = (member: Member) => {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = (data: MemberInsert) => {
    if (selectedMember) {
      updateMember.mutate(
        { id: selectedMember.id, ...data },
        {
          onSuccess: () => setFormOpen(false),
        }
      );
    } else {
      createMember.mutate(data, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedMember) {
      deleteMember.mutate(selectedMember.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedMember(null);
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <DashboardSidebar
            isCollapsed={false}
            onToggle={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="p-4 lg:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="animate-fade-in">
              <h1 className="font-display text-2xl lg:text-3xl text-foreground">
                Gestion des membres
              </h1>
              <p className="text-muted-foreground mt-1">
                {members.length} membre{members.length > 1 ? "s" : ""} enregistré
                {members.length > 1 ? "s" : ""}
              </p>
            </div>
            <Button onClick={handleAddMember} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Ajouter un membre
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <MembersFilters
              search={search}
              onSearchChange={setSearch}
              serviceFilter={serviceFilter}
              onServiceFilterChange={setServiceFilter}
              baptismFilter={baptismFilter}
              onBaptismFilterChange={setBaptismFilter}
              services={services}
            />
          </div>

          {/* Members Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[160px] rounded-xl" />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg text-foreground mb-2">
                {members.length === 0 ? "Aucun membre" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground max-w-sm">
                {members.length === 0
                  ? "Commencez par ajouter votre premier membre à l'église."
                  : "Aucun membre ne correspond à vos critères de recherche."}
              </p>
              {members.length === 0 && (
                <Button onClick={handleAddMember} className="mt-4 gap-2">
                  <UserPlus className="h-4 w-4" />
                  Ajouter un membre
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onEdit={handleEditMember}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Dialogs */}
      <MemberForm
        open={formOpen}
        onOpenChange={setFormOpen}
        member={selectedMember}
        onSubmit={handleFormSubmit}
        isLoading={createMember.isPending || updateMember.isPending}
      />

      <DeleteMemberDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        member={selectedMember}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMember.isPending}
      />
    </div>
  );
};

export default Members;
