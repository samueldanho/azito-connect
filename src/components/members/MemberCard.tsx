import { Member } from "@/hooks/useMembers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MapPin, Edit2, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MemberCardProps {
  member: Member & {
    services?: {
      id: string;
      nom: string;
      couleur: string | null;
    } | null;
  };
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

export const MemberCard = ({ member, onEdit, onDelete }: MemberCardProps) => {
  const initials = member.nom_complet
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isBaptise = member.statut_bapteme === "baptise";

  return (
    <Card className="group hover:shadow-card transition-all duration-200 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarImage src={member.photo_url || undefined} alt={member.nom_complet} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">
                  {member.nom_complet}
                </h3>
                {member.services && (
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: member.services.couleur || "#D97706" }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {member.services.nom}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(member)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(member)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Details */}
            <div className="mt-3 space-y-1.5">
              {member.telephone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{member.telephone}</span>
                </div>
              )}
              {member.lieu_habitation && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{member.lieu_habitation}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge
                variant={isBaptise ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  isBaptise
                    ? "bg-success/15 text-success hover:bg-success/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isBaptise ? "Baptisé" : "Non baptisé"}
              </Badge>
              {!member.est_actif && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Inactif
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
