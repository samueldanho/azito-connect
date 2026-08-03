import { useState, useMemo, useEffect } from "react";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, X, Search, UserCheck, UserX, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Member } from "@/hooks/useMembers";
import { PresenceWithMember, TypeActivite, PresenceInsert } from "@/hooks/usePresences";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

// Helper component for signed URL avatars in lists
const SignedAvatar = ({ photoUrl, name, className }: { photoUrl: string | null; name: string; className?: string }) => {
  const resolvedUrl = useSignedUrl(photoUrl);
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Avatar className={className || "h-10 w-10"}>
      <AvatarImage src={resolvedUrl || undefined} alt={name} />
      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

interface PresenceListProps {
  members: Member[];
  presences: PresenceWithMember[];
  services: Tables<"services">[];
  date: Date;
  typeActivite: TypeActivite;
  serviceFilter: string;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (presences: PresenceInsert[]) => void;
}

export const PresenceList = ({
  members,
  presences,
  services,
  date,
  typeActivite,
  serviceFilter,
  isLoading,
  isSaving,
  onSave,
}: PresenceListProps) => {
  const [search, setSearch] = useState("");
  const [presenceState, setPresenceState] = useState<Record<string, boolean>>({});
  const [lastContextKey, setLastContextKey] = useState("");

  // Create a stable key for the current context (date + type + service)
  const contextKey = `${format(date, "yyyy-MM-dd")}-${typeActivite}-${serviceFilter}`;

  // Initialize presence state from existing presences when context changes or initial load
  useEffect(() => {
    // Only initialize when context changes
    if (contextKey !== lastContextKey) {
      const initial: Record<string, boolean> = {};
      presences.forEach((p) => {
        if (p.membre_id) {
          initial[p.membre_id] = p.est_present;
        }
      });
      setPresenceState(initial);
      setLastContextKey(contextKey);
    }
  }, [presences, contextKey, lastContextKey]);

  // Filter members based on search and service
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const searchMatch =
        !search ||
        member.nom_complet.toLowerCase().includes(search.toLowerCase());

      const serviceMatch =
        !serviceFilter ||
        serviceFilter === "all" ||
        member.service_id === serviceFilter;

      return searchMatch && serviceMatch && member.est_actif;
    });
  }, [members, search, serviceFilter]);

  const togglePresence = (memberId: string) => {
    setPresenceState((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const markAllPresent = () => {
    const newState: Record<string, boolean> = {};
    filteredMembers.forEach((m) => {
      newState[m.id] = true;
    });
    setPresenceState((prev) => ({ ...prev, ...newState }));
  };

  const markAllAbsent = () => {
    const newState: Record<string, boolean> = {};
    filteredMembers.forEach((m) => {
      newState[m.id] = false;
    });
    setPresenceState((prev) => ({ ...prev, ...newState }));
  };

  const handleSave = () => {
    const dateStr = format(date, "yyyy-MM-dd");
    // Les membres sans service ne peuvent pas être enregistrés (règles d'accès par service)
    const saveable = filteredMembers.filter((m) => !!m.service_id);
    const skipped = filteredMembers.length - saveable.length;

    if (saveable.length === 0) {
      toast.error("Aucun membre enregistrable", {
        description: "Ces membres ne sont affectés à aucun service. Affectez-les d'abord.",
      });
      return;
    }

    if (skipped > 0) {
      toast(`${skipped} membre${skipped > 1 ? "s" : ""} ignoré${skipped > 1 ? "s" : ""}`, {
        description: "Membres sans service affecté — leur présence n'a pas été enregistrée.",
      });
    }


    const presencesToSave: PresenceInsert[] = saveable.map((member) => ({
      membre_id: member.id,
      date_presence: dateStr,
      type_activite: typeActivite,
      est_present: presenceState[member.id] ?? false,
      service_id: member.service_id,
    }));
    onSave(presencesToSave);
  };


  const getServiceInfo = (serviceId: string | null) => {
    if (!serviceId) return null;
    return services.find((s) => s.id === serviceId);
  };

  const presentCount = filteredMembers.filter((m) => presenceState[m.id]).length;
  const absentCount = filteredMembers.length - presentCount;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">
              Liste des présences - {format(date, "EEEE d MMMM yyyy", { locale: fr })}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredMembers.length} membre{filteredMembers.length > 1 ? "s" : ""} •{" "}
              <span className="text-success">{presentCount} présent{presentCount > 1 ? "s" : ""}</span> •{" "}
              <span className="text-destructive">{absentCount} absent{absentCount > 1 ? "s" : ""}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllPresent} className="gap-1">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Tous présents</span>
            </Button>
            <Button variant="outline" size="sm" onClick={markAllAbsent} className="gap-1">
              <UserX className="h-4 w-4" />
              <span className="hidden sm:inline">Tous absents</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Members List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun membre trouvé
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isPresent = presenceState[member.id] ?? false;
              const service = getServiceInfo(member.service_id);

              return (
                <div
                  key={member.id}
                  onClick={() => togglePresence(member.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    isPresent
                      ? "bg-success/10 border-success/30 hover:bg-success/20"
                      : "bg-background hover:bg-muted/50 border-border"
                  )}
                >
                  <Checkbox
                    checked={isPresent}
                    onCheckedChange={() => togglePresence(member.id)}
                    className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                  />
                  <SignedAvatar photoUrl={member.photo_url} name={member.nom_complet} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.nom_complet}</p>
                    {service && (
                      <Badge
                        variant="secondary"
                        className="text-xs mt-1"
                        style={{
                          backgroundColor: `${service.couleur}20`,
                          color: service.couleur || undefined,
                        }}
                      >
                        {service.nom}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {isPresent ? (
                      <div className="flex items-center gap-1 text-success">
                        <Check className="h-5 w-5" />
                        <span className="text-sm font-medium hidden sm:inline">Présent</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span className="text-sm font-medium hidden sm:inline">Absent</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Save Button */}
        {filteredMembers.length > 0 && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full gap-2"
              size="lg"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Enregistrement..." : "Enregistrer les présences"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
